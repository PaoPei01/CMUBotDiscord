import { describe, expect, it } from "vitest";

import { searchKnowledge } from "../src/services/knowledgeSearch.js";
import type { SupabaseFetchClient } from "../src/services/supabaseClient.js";

type TestFaq = {
  answer_full: string;
  answer_short: string;
  audience: string;
  category: string;
  faculty_group: string | null;
  id: string;
  priority: string;
  question: string;
  source: {
    id: string;
    last_verified_at: string | null;
    name: string;
    url: string | null;
  };
  source_page: string | null;
  source_quote: string | null;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
};

type TestRpcRow = Omit<TestFaq, "source" | "status"> & {
  source_id: string | null;
  source_last_verified_at: string | null;
  source_name: string | null;
  source_url: string | null;
};

const activeFaqs: TestFaq[] = [
  {
    answer_full: "Students must pay tuition from 6-10 July 2026.",
    answer_short: "Pay tuition from 6-10 July 2026.",
    audience: "students",
    category: "Tuition",
    faculty_group: null,
    id: "faq-tuition",
    priority: "medium",
    question: "When do students pay tuition?",
    source: {
      id: "source-1",
      last_verified_at: "2026-06-02T00:00:00Z",
      name: "Verified Source",
      url: "https://example.edu"
    },
    source_page: null,
    source_quote: null,
    status: "active",
    valid_from: null,
    valid_until: null
  },
  {
    answer_full: "Student card photos must be front-facing color photos.",
    answer_short: "Use a front-facing color photo.",
    audience: "students",
    category: "Photo",
    faculty_group: null,
    id: "faq-photo",
    priority: "medium",
    question: "What photo is required for a student card?",
    source: {
      id: "source-1",
      last_verified_at: "2026-06-02T00:00:00Z",
      name: "Verified Source",
      url: "https://example.edu"
    },
    source_page: null,
    source_quote: null,
    status: "active",
    valid_from: null,
    valid_until: null
  }
];

function rpcRow(faq: TestFaq): TestRpcRow {
  return {
    answer_full: faq.answer_full,
    answer_short: faq.answer_short,
    audience: faq.audience,
    category: faq.category,
    faculty_group: faq.faculty_group,
    id: faq.id,
    priority: faq.priority,
    question: faq.question,
    source_id: faq.source.id,
    source_last_verified_at: faq.source.last_verified_at,
    source_name: faq.source.name,
    source_page: faq.source_page,
    source_quote: faq.source_quote,
    source_url: faq.source.url,
    valid_from: faq.valid_from,
    valid_until: faq.valid_until
  };
}

function client({
  aliases = [],
  aliasRows = [],
  exactRows = [],
  faqs = activeFaqs,
  fullTextRows = [],
  keywordRows = []
}: {
  aliases?: Array<{ alias: string; faq_id: string }>;
  aliasRows?: unknown[];
  exactRows?: unknown[];
  faqs?: TestFaq[];
  fullTextRows?: unknown[];
  keywordRows?: unknown[];
} = {}): SupabaseFetchClient & { calls: string[] } {
  const calls: string[] = [];

  return {
    calls,
    request<T>(path: string): Promise<T> {
      calls.push(path);

      if (path === "rpc/search_active_faq_exact") {
        return Promise.resolve(exactRows as T);
      }

      if (path === "rpc/search_active_faq_alias") {
        return Promise.resolve(aliasRows as T);
      }

      if (path === "rpc/search_active_faq_keyword") {
        return Promise.resolve(keywordRows as T);
      }

      if (path.startsWith("faqs?")) {
        return Promise.resolve(faqs as T);
      }

      if (path.startsWith("faq_aliases?")) {
        return Promise.resolve(aliases as T);
      }

      if (path.startsWith("faq_keywords?")) {
        return Promise.resolve(
          [
            { faq_id: "faq-tuition", keyword: "tuition" },
            { faq_id: "faq-photo", keyword: "photo" }
          ] as T
        );
      }

      if (path === "rpc/search_active_faqs_full_text") {
        return Promise.resolve(fullTextRows as T);
      }

      throw new Error(`Unexpected path ${path}`);
    }
  };
}

describe("worker searchKnowledge", () => {
  it("returns exact RPC matches without fetching all FAQs", async () => {
    const testClient = client({ exactRows: [rpcRow(activeFaqs[0]!)] });
    const result = await searchKnowledge(testClient, "When do students pay tuition?");

    expect(result.method).toBe("exact");
    expect(result.confidence).toBe(95);
    expect(result.faqId).toBe("faq-tuition");
    expect(testClient.calls).toEqual(["rpc/search_active_faq_exact"]);
  });

  it("returns alias RPC matches without fetching all FAQs", async () => {
    const testClient = client({ aliasRows: [rpcRow(activeFaqs[0]!)] });
    const result = await searchKnowledge(testClient, "tuition date");

    expect(result.method).toBe("alias");
    expect(result.confidence).toBe(90);
    expect(result.faqId).toBe("faq-tuition");
    expect(testClient.calls).toEqual([
      "rpc/search_active_faq_exact",
      "rpc/search_active_faq_alias"
    ]);
  });

  it("returns keyword RPC matches without fetching all FAQs", async () => {
    const testClient = client({ keywordRows: [rpcRow(activeFaqs[0]!)] });
    const result = await searchKnowledge(testClient, "I need tuition info");

    expect(result.method).toBe("keyword");
    expect(result.confidence).toBe(80);
    expect(result.faqId).toBe("faq-tuition");
    expect(testClient.calls).toEqual([
      "rpc/search_active_faq_exact",
      "rpc/search_active_faq_alias",
      "rpc/search_active_faq_keyword"
    ]);
  });

  it("returns PostgreSQL full-text matches", async () => {
    const testClient = client({
      fullTextRows: [
        {
          ...rpcRow(activeFaqs[1]!),
          rank: 0.12
        }
      ]
    });
    const result = await searchKnowledge(
      testClient,
      "front-facing color requirement"
    );

    expect(result.method).toBe("full_text");
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.confidence).toBeLessThanOrEqual(85);
    expect(result.faqId).toBe("faq-photo");
    expect(testClient.calls).not.toContain(
      "faqs?select=*,source:sources(id,name,url,last_verified_at)&status=eq.active"
    );
  });

  it("returns fuzzy matches above the safe threshold", async () => {
    const result = await searchKnowledge(client(), "Whatphotoisrequiredforastudentcard");

    expect(result.method).toBe("fuzzy");
    expect(result.confidence).toBeGreaterThanOrEqual(60);
    expect(result.confidence).toBeLessThanOrEqual(75);
    expect(result.faqId).toBe("faq-photo");
  });

  it("falls back when RPCs return no rows", async () => {
    const testClient = client();
    const result = await searchKnowledge(testClient, "Whatphotoisrequiredforastudentcard");

    expect(result.method).toBe("fuzzy");
    expect(testClient.calls).toContain(
      "faqs?select=*,source:sources(id,name,url,last_verified_at)&status=eq.active"
    );
  });

  it("does not serve expired active FAQs", async () => {
    const result = await searchKnowledge(
      client({
        faqs: [
          {
            ...activeFaqs[0]!,
            valid_until: "2020-01-01T00:00:00Z"
          }
        ]
      }),
      "When do students pay tuition?"
    );

    expect(result.method).toBe("none");
    expect(result.confidence).toBe(0);
  });

  it("does not serve inactive FAQs", async () => {
    const result = await searchKnowledge(
      client({
        faqs: [
          {
            ...activeFaqs[0]!,
            status: "inactive"
          }
        ]
      }),
      "When do students pay tuition?"
    );

    expect(result.method).toBe("none");
    expect(result.confidence).toBe(0);
  });

  it("returns not-found when no deterministic layer matches", async () => {
    const result = await searchKnowledge(client(), "parking permit for staff");

    expect(result.method).toBe("none");
    expect(result.confidence).toBe(0);
    expect(result.faqId).toBeNull();
  });
});
