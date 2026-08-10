"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Star } from "@phosphor-icons/react";
import clsx from "clsx";

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export function Reviews({
  productId,
  initialReviews = [],
}: {
  productId: string;
  initialReviews?: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userName || !comment) {return;}

    setIsSubmitting(true);
    const newReview = {
      id: Math.random().toString(),
      user_name: userName,
      rating,
      comment,
      created_at: new Date().toISOString(),
      product_id: productId,
    };

    await new Promise((r) => setTimeout(r, 500));
    setReviews([newReview, ...reviews]);
    setComment("");
    setUserName("");
    setRating(5);
    setIsSubmitting(false);
  };

  return (
    <section className="shell-container mx-auto px-4 md:px-6 2xl:px-0">
      <div className="pdp-reviews-shell">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.85fr)_minmax(22rem,0.9fr)]">
          <div className="border-b border-theme-soft p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="pdp-reviews-kicker">
              Customer Reviews
            </p>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="home-heading text-balance">
                  Client feedback
                </h3>
                <p className="page-copy-sm text-body mt-3 max-w-xl">
                  Decision-makers use this section to gauge lived experience, not marketing copy. Keep it specific and useful.
                </p>
              </div>
              <div className="pdp-reviews-summary" aria-label={`Average rating ${avgRating} from ${reviews.length} reviews`}>
                <div className="mb-1 flex gap-1 text-primary" aria-hidden="true">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        "h-4 w-4",
                        i < Math.round(Number(avgRating))
                          ? "fill-current"
                          : "text-muted fill-transparent",
                      )}
                    />
                  ))}
                </div>
                <span className="block text-lg font-semibold text-strong">
                  {avgRating}
                </span>
                <span className="pdp-reviews-count">
                  {reviews.length} reviews
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="pdp-reviews-empty">
                  <p className="text-sm font-medium text-body">
                    No reviews yet.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-subtle">
                    The first project note should mention what held up in daily use, how it felt after longer sessions, and whether the finish quality matched expectations.
                  </p>
                </div>
              ) : (
                reviews.map((r) => (
                  <article
                    key={r.id}
                    className="pdp-reviews-item"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="block text-sm font-semibold text-strong">
                          {r.user_name}
                        </span>
                        <span className="pdp-reviews-date">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        className="flex text-primary"
                        aria-label={`${r.rating} out of 5 stars`}
                      >
                        <span className="flex" aria-hidden="true">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={clsx(
                                "h-3.5 w-3.5",
                                i < r.rating
                                  ? "fill-current"
                                  : "text-muted fill-transparent",
                              )}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-body">
                      {r.comment}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="pdp-reviews-form-panel p-6 sm:p-8">
            <div className="pdp-reviews-form-card">
              <p className="pdp-reviews-kicker mb-2">
                Write a review
              </p>
              <h4 className="typ-h3 text-strong">
                Add a practical note
              </h4>
              <p className="page-copy-sm text-body mt-3">
                Focus on comfort, finish quality, fit for use, and what would matter to the next buyer.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
                toolname="submitProductReview"
                tooldescription="Submit a product review with star rating, name, and practical usage comments."
              >
                <div>
                  <span id="review-rating-label" className="pdp-reviews-label">
                    Rating
                  </span>
                  <div
                    className="flex gap-2"
                    role="group"
                    aria-labelledby="review-rating-label"
                    aria-label={`Selected rating ${rating} of 5`}
                  >
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRating(val)}
                        aria-label={`Rate ${val} stars`}
                        aria-pressed={rating === val}
                        title={`Rate ${val} stars`}
                        className="pdp-reviews-star-button"
                      >
                        <Star
                          aria-hidden="true"
                          className={clsx(
                            "h-5 w-5",
                            val <= rating
                              ? "text-primary fill-current"
                              : "text-muted fill-transparent",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="userName"
                    className="pdp-reviews-label"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="pdp-reviews-input"
                    autoComplete="name"
                    required
                    toolparamdescription="Display name of the reviewer."
                  />
                </div>
                <div>
                  <label
                    htmlFor="comment"
                    className="pdp-reviews-label"
                  >
                    Review
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={5}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="pdp-reviews-input pdp-reviews-input--textarea"
                    autoComplete="off"
                    required
                    toolparamdescription="Practical review notes: comfort, finish, fit for use, and tips for the next buyer."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="pdp-reviews-submit"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
