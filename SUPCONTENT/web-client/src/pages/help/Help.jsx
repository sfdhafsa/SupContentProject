import { Link } from "react-router-dom";

const HELP_TOPICS = [
  {
    title: "Account access",
    text: "Sign in with email/password or Google. If you forgot your password, use the reset link from the login page.",
    action: "Reset password",
    to: "/forgot-password",
  },
  {
    title: "Profile settings",
    text: "Update your username, avatar, bio, website, theme, language, and notification preferences from settings.",
    action: "Open settings",
    to: "/settings",
  },
  {
    title: "Discover movies",
    text: "Use the search bar or Discover page to find movies from TMDB and open complete movie details.",
    action: "Discover",
    to: "/discover",
  },
];

const FAQ = [
  {
    question: "Why can I see public pages without logging in?",
    answer: "SUPMOVIES allows visitors to browse public content. You need an account only for personal actions like profile updates, library, lists, reviews, likes, and follows.",
  },
  {
    question: "Why does password reset show a link directly?",
    answer: "In development mode, the reset link is displayed so the feature can be tested without an email service. In production, the link should be sent by email.",
  },
  {
    question: "Why does Google login return to my profile?",
    answer: "After OAuth login, the backend creates or finds your local account, sends a token to the web client, then the app loads your username, email, and avatar.",
  },
  {
    question: "What data can I export?",
    answer: "Your personal export includes account data and prepared sections for library, custom lists, reviews, and social activity when those modules are connected.",
  },
];

export default function Help() {
  return (
    <main className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <section className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-14 md:py-16">
          <p className="text-sm font-semibold text-[#D0021B] mb-3">SUPMOVIES Help</p>
          <h1 className="text-3xl md:text-5xl font-bold max-w-3xl leading-tight">
            Find answers and keep moving through the app.
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base leading-7 text-gray-500 dark:text-gray-400">
            Quick help for account access, profile settings, movie discovery, password reset, and project features.
          </p>
        </div>
      </section>

      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {HELP_TOPICS.map((topic) => (
            <article
              key={topic.title}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
            >
              <h2 className="text-lg font-bold">{topic.title}</h2>
              <p className="mt-2 min-h-20 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {topic.text}
              </p>
              <Link
                to={topic.to}
                className="mt-4 inline-flex items-center text-sm font-semibold text-[#D0021B] hover:underline"
              >
                {topic.action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-14 md:pb-16">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-2xl font-bold">FAQ</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              The essentials for testing and presenting your authentication/profile part.
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
            {FAQ.map((item) => (
              <article key={item.question} className="py-5">
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
