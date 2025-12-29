'use client';

import { XEmbed, type XEmbedProps } from 'react-social-media-embed';

/**
 * Embedding X Posts in Fumadocs
 *
 * https://rjv.im/blog/solution/embed-x-post-in-fuma-docs
 */
export function XEmbedClient({ ...props }: XEmbedProps) {
  return (
    <div className="flex justify-center">
      <XEmbed {...props} />
    </div>
  );
}
