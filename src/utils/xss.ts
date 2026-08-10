import xss from 'xss'

/**
 * xss预防
 */
export default function sanitize(body: any) {
  const test = { ...body }
  for (const key in test) {
    if (test[key] && typeof test[key] === 'string') {
      test[key] = xss(test[key], options)
    }
  }
  return test
}

// 基本规则
const baseRegular = ['class', 'style']
// 设置HTML过滤器的白名单
const options = {
  whiteList: {
    p: baseRegular,
    em: baseRegular,
    strong: baseRegular,
    br: baseRegular,
    u: baseRegular,
    s: baseRegular,
    blockquote: baseRegular,
    li: baseRegular,
    ol: baseRegular,
    ul: baseRegular,
    h1: baseRegular,
    h2: baseRegular,
    h3: baseRegular,
    h4: baseRegular,
    h5: baseRegular,
    h6: baseRegular,
    img: [...baseRegular, 'src', 'width'],
  },
}
