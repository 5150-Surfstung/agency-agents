"use client";

// THE CARD PEOPLE SAVE.
//
// An identity block built the way a bank builds an account card: a hairline
// frame, a precise photo, the facts in a column, and two actions that both do
// something real. "Save my contact" hands over the vCard route — the phone's
// own Add Contact sheet opens, and the number that lands in their phone is the
// same string the slide shows, because both read lib/contact.
//
// The photo: the file is dropped at /public/headshot.jpg and appears. Until it
// is there, the frame holds a monogram at the same weight rather than a broken
// image or a grey person icon, so the card is never waiting to look finished.

import { useState } from "react";
import { HOST } from "@/lib/contact";

export function Profile() {
  const [noPhoto, setNoPhoto] = useState(false);

  return (
    <div className="card">
      <div className="card-rail">
        <span>The AGENT Connection</span>
        <span>eXp Realty</span>
      </div>

      <div className="card-body">
        <div className="card-shot">
          {noPhoto ? (
            <span className="card-mono" aria-hidden>
              MO
            </span>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/headshot.jpg"
              alt={`${HOST.full}, ${HOST.title} at ${HOST.org}`}
              width={360}
              height={360}
              onError={() => setNoPhoto(true)}
            />
          )}
        </div>

        <div className="card-who">
          <p className="card-name display">{HOST.full}</p>
          <p className="card-role">{HOST.title}</p>
          <p className="card-org">
            {HOST.org}
            <span>
              REALTOR<sup>®</sup>, {HOST.brokerage}
            </span>
          </p>
        </div>
      </div>

      <dl className="card-facts">
        <div>
          <dt>Cell</dt>
          <dd>{HOST.cell}</dd>
        </div>
        <div>
          <dt>Market</dt>
          <dd>
            {HOST.city}, {HOST.state}
          </dd>
        </div>
      </dl>

      <div className="card-go">
        <a href="/api/vcard" className="card-primary" download>
          Save my contact
        </a>
        <a href={`sms:${HOST.cellE164}`} className="card-secondary">
          Text me
        </a>
      </div>
      <p className="card-note">
        The save button hands your phone a real contact card — it opens your own
        Add Contact sheet. Nothing is collected on this end.
      </p>
    </div>
  );
}
