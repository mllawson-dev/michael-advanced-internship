import Image from "next/image";
import Link from "next/link";

// Figures and copy are supplied internship reference content, not live analytics.
const statisticsGroups = [
  {
    benefits: ["Enhance your knowledge", "Achieve greater success", "Improve your health", "Develop better parenting skills", "Increase happiness", "Be the best version of yourself!"],
    statistics: [
      { value: "93%", before: "of Summarist members ", emphasis: "significantly increase", after: " reading frequency." },
      { value: "96%", before: "of Summarist members ", emphasis: "establish better", after: " habits." },
      { value: "90%", before: "have made ", emphasis: "significant positive", after: " change to their lives." },
    ],
  },
  {
    benefits: ["Expand your learning", "Accomplish your goals", "Strengthen your vitality", "Become a better caregiver", "Improve your mood", "Maximize your abilities"],
    statistics: [
      { value: "91%", before: "of Summarist members ", emphasis: "report feeling more productive", after: " after incorporating the service into their daily routine." },
      { value: "94%", before: "of Summarist members have ", emphasis: "noticed an improvement", after: " in their overall comprehension and retention of information." },
      { value: "88%", before: "of Summarist members ", emphasis: "feel more informed", after: " about current events and industry trends since using the platform." },
    ],
  },
];

// Testimonials are supplied internship reference copy.
const reviews = [
  { name: "Hanna M.", before: "This app has been a ", emphasis: "game-changer", after: " for me! It's saved me so much time and effort in reading and comprehending books. Highly recommend it to all book lovers." },
  { name: "David B.", before: "I love this app! It provides ", emphasis: "concise and accurate summaries", after: " of books in a way that is easy to understand. It's also very user-friendly and intuitive." },
  { name: "Nathan S.", before: "This app is a great way to get the main takeaways from a book without having to read the entire thing. ", emphasis: "The summaries are well-written and informative.", after: " Definitely worth downloading." },
  { name: "Ryan R.", before: "If you're a busy person who ", emphasis: "loves reading but doesn't have the time", after: " to read every book in full, this app is for you! The summaries are thorough and provide a great overview of the book's content." },
];

const footerGroups = [
  { title: "Actions", items: ["Summarist Magazine", "Cancel Subscription", "Help", "Contact us"] },
  { title: "Useful Links", items: ["Pricing", "Summarist Business", "Gift Cards", "Authors & Publishers"] },
  { title: "Company", items: ["About", "Careers", "Partners", "Code of Conduct"] },
  { title: "Other", items: ["Sitemap", "Legal Notice", "Terms of Service", "Privacy Policies"] },
];

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="nav">
        <nav className="nav__wrapper" aria-label="Main navigation">
          <Link className="nav__brand" href="/" aria-label="Summarist home">
            <Image src="/assets/logo.png" alt="Summarist" width={495} height={114} preload />
          </Link>
          <ul className="nav__list" role="list">
            <li><button className="nav__login" type="button" disabled title="Login will be available when authentication is added">Login</button></li>
            { ["About", "Contact", "Help"].map((label) => (
              <li className="nav__secondary" key={label}>
                <span aria-disabled="true" title={`${label} is not available yet`}>{label}</span>
              </li>
            )) }
          </ul>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="landing" aria-labelledby="landing-title">
          <div className="landing__wrapper">
            <div className="landing__content">
              <h1 id="landing-title">Gain more knowledge <br className="desktop-break" />in less time</h1>
              <p className="landing__subtitle">
                Great summaries for busy people,{" "}<br className="desktop-break" />
                individuals who barely have time to read,{" "}<br className="desktop-break" />
                and even people who don’t like to read.
              </p>
              <button className="button" type="button" disabled aria-describedby="login-availability">Login</button>
              <p className="login-availability" id="login-availability">Login coming soon.</p>
            </div>
            <Image className="landing__image" src="/assets/landing.png" alt="A reader exploring ideas through books" width={779} height={740} sizes="(max-width: 768px) 1px, 400px" preload />
          </div>
        </section>
        <section className="features-section" aria-labelledby="features-title">
          <div className="features-container">
            <h2 id="features-title">Understand books in few minutes</h2>
            <ul className="features-grid" role="list">
              <li className="feature">
                <svg className="feature__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                  <path d="M5 2h9l5 5v15H5V2Zm9 2v4h4l-4-4ZM8 11v2h8v-2H8Zm0 4v2h8v-2H8Zm0 4v1h5v-1H8Z" />
                </svg>
                <h3>Read or listen</h3>
                <p>Save time by getting the core ideas from the best books.</p>
              </li>
              <li className="feature">
                <svg className="feature__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                  <path d="M12 2a7 7 0 0 0-5 11.9c1.1 1.1 1.5 2.1 1.5 3.1h7c0-1 .4-2 1.5-3.1A7 7 0 0 0 12 2ZM9 18h6v2H9v-2Zm1 3h4v1h-4v-1Z" />
                </svg>
                <h3>Find your next read</h3>
                <p>Explore book lists and personalized recommendations.</p>
              </li>
              <li className="feature">
                <svg className="feature__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                  <path d="M12 2a9 9 0 0 0-9 9v8a3 3 0 0 0 3 3h3V12H5v-1a7 7 0 0 1 14 0v1h-4v10h3a3 3 0 0 0 3-3v-8a9 9 0 0 0-9-9Z" />
                </svg>
                <h3>Briefcasts</h3>
                <p>Gain valuable insights from briefcasts</p>
              </li>
            </ul>
          </div>
        </section>
        <section className="statistics-section" aria-label="Benefits of Summarist">
          <div className="statistics-container">
            {statisticsGroups.map((group, index) => (
              <div className={`statistics-row${index === 1 ? " statistics-row--reverse" : ""}`} key={group.benefits[0]}>
                <ul className="statistics-benefits" role="list">
                  {group.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
                </ul>
                <dl className="statistics-panel">
                  {group.statistics.map((statistic) => (
                    <div className="statistic" key={statistic.value}>
                      <dt>{statistic.value}</dt>
                      <dd>{statistic.before}<strong>{statistic.emphasis}</strong>{statistic.after}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
        <section className="reviews-section" id="reviews" aria-labelledby="reviews-title">
          <div className="reviews-container">
            <h2 id="reviews-title">What our members say</h2>
            <ul className="reviews-list" role="list">
              {reviews.map((review) => (
                <li className="review" key={review.name}>
                  <figure>
                    <figcaption className="review__header">
                      <span>{review.name}</span>
                      <svg className="review__star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />
                      </svg>
                    </figcaption>
                    <blockquote>{review.before}<strong>{review.emphasis}</strong>{review.after}</blockquote>
                  </figure>
                </li>
              ))}
            </ul>
            <div className="reviews-action">
              <button className="button" type="button" disabled aria-describedby="reviews-login-availability">Login</button>
              <p className="login-availability" id="reviews-login-availability">Login coming soon.</p>
            </div>
          </div>
        </section>
        <section className="numbers-section" id="numbers" aria-labelledby="numbers-title">
          <div className="numbers-container">
            <h2 id="numbers-title">Start growing with Summarist now</h2>
            {/* Metrics are supplied internship reference content, not live analytics. */}
            <ul className="numbers-grid" role="list">
              <li className="number-card">
                <div className="number-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" focusable="false">
                    <path d="m3 6 5 4 4-7 4 7 5-4-2 13H5L3 6Z" strokeLinejoin="round" />
                    <path d="M5 16h14" />
                  </svg>
                </div>
                <h3>3 Million</h3>
                <p>Downloads on all platforms</p>
              </li>
              <li className="number-card">
                <div className="number-card__icon number-card__icon--stars" aria-hidden="true">
                  {[0, 1, 2, 3].map((star) => (
                    <svg key={star} viewBox="0 0 24 24" fill="currentColor" focusable="false">
                      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />
                    </svg>
                  ))}
                  <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
                    <path d="M12 2v15.8L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />
                  </svg>
                </div>
                <h3>4.5 Stars</h3>
                <p>Average ratings on iOS and Google Play</p>
              </li>
              <li className="number-card">
                <div className="number-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" focusable="false">
                    <path d="M20 3C11 2 4 6 4 13a7 7 0 0 0 7 7c7 0 10-8 9-17Z" strokeLinejoin="round" />
                    <path d="M3 22 16 9M8 17v-5m0 5h5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3>97%</h3>
                <p>Of Summarist members create a better reading habit</p>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <footer className="footer" id="footer">
        <div className="footer-container">
          <div className="footer-groups">
            {footerGroups.map((group) => (
              <section className="footer-group" key={group.title} aria-label={group.title}>
                <h2>{group.title}</h2>
                <ul role="list">
                  {group.items.map((item) => (
                    <li key={item}>
                      <span className="footer-item" aria-disabled="true" title={`${item} is not available yet`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="footer-copyright">Copyright &copy; 2023 Summarist.</p>
        </div>
      </footer>
    </>
  );
}
