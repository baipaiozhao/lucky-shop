import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
}

const SITE_NAME = '我买我卖';
const DEFAULT_DESC = '购物即游戏 — 每次下单都有惊喜。5款自研小游戏，赢取优惠券、积分、实物奖品。';

export default function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const desc = description || DEFAULT_DESC;
  const siteUrl = url || window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      <link rel="canonical" href={siteUrl} />
    </Helmet>
  );
}

export { SITE_NAME, DEFAULT_DESC };
