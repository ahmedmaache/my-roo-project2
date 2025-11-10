/**
 * FAQ Page - Frequently Asked Questions
 * 
 * Static FAQ content about the Gloven program.
 */

export default function FAQPage() {
  const faqs = [
    {
      question: "How much equity does Gloven take?",
      answer: "We invest $100K-$150K on a post-money SAFE with a standard 7% equity stake. We're founder-friendly and transparent about our terms from day one."
    },
    {
      question: "What stage should my startup be at?",
      answer: "We work with pre-seed to seed-stage startups. Ideal candidates have a working MVP, initial traction (users, revenue, or partnerships), and a clear vision for global expansion."
    },
    {
      question: "Is the program remote or in-person?",
      answer: "The program is hybrid. Core programming happens virtually to accommodate founders across time zones, with optional in-person events (Demo Day, workshops) in major hubs."
    },
    {
      question: "What's the timeline from application to decision?",
      answer: "Applications are reviewed on a rolling basis. You'll hear from us within 2-3 weeks of submission. Selected startups go through interviews before being invited to join the next cohort."
    },
    {
      question: "What's the acceptance rate?",
      answer: "We're highly selective, accepting approximately 8-10% of applications. We prioritize quality over quantity and look for founders with exceptional vision, grit, and market understanding."
    },
    {
      question: "Do you accept solo founders?",
      answer: "Yes! While we value strong teams, we've backed successful solo founders. What matters most is your ability to execute, learn quickly, and attract talent as you grow."
    },
    {
      question: "What regions do you focus on?",
      answer: "We focus on emerging markets globally, with particular strength in Africa, LATAM, Southeast Asia, and Eastern Europe. We're region-agnostic but prioritize underserved markets with high growth potential."
    },
    {
      question: "Can I apply if I'm already funded?",
      answer: "Absolutely. If you've raised a pre-seed or friends & family round and are looking for your next growth stage, Gloven can help you scale globally through our network and resources."
    },
    {
      question: "What happens after the program?",
      answer: "Gloven is a long-term partner. After the 12-week core program, you remain part of our alumni network with continued access to mentors, investors, and resources. We also help with follow-on fundraising."
    },
    {
      question: "How do I contact Gloven?",
      answer: "For general inquiries, email us at hello@gloven.org. For application-specific questions, reach out to applications@gloven.org. We respond within 48 hours."
    },
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mb-16">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Help & Support</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Common questions about the Gloven program, application process, and what to expect.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 p-8 rounded-lg text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            We're here to help. Reach out to our team and we'll get back to you within 48 hours.
          </p>
          <a
            href="mailto:hello@gloven.org"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}