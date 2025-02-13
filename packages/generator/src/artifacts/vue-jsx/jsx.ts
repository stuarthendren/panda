import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateVueJsxFactory(ctx: Context) {
  const { factoryName } = ctx.jsx

  return {
    js: outdent`
    import { defineComponent, h, computed } from 'vue'
    ${ctx.file.import('css, cx, cva, assignCss', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}

    function styledFn(Dynamic, configOrCva = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)
      const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'

      return defineComponent({
        name: \`${factoryName}.\${name}\`,
        inheritAttrs: false,
        props: { as: { type: [String, Object], default: Dynamic } },
        setup(props, { slots, attrs }) {
          const splittedProps = computed(() => {
            return splitProps(attrs, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
          })

          const recipeClass = computed(() => {
            const [variantProps, styleProps, _htmlProps, elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const styles = assignCss(propStyles, cssStyles)
            return cx(cvaFn(variantProps), css(styles), elementProps.className)
          })

          const cvaClass = computed(() => {
            const [variantProps, styleProps, _htmlProps, elementProps] = splittedProps.value
            const { css: cssStyles, ...propStyles } = styleProps
            const styles = assignCss(propStyles, cssStyles)
            return cx(cvaFn(variantProps), css(styles), elementProps.className)
          })

          const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

          return () => {
            const [_styleProps, _variantProps, htmlProps, elementProps] = splittedProps.value

            return h(
              props.as,
              {
                class: classes.value,
                ...elementProps,
                ...normalizeHTMLProps(htmlProps),
              },
              slots.default && slots.default(),
            )
          }
        },
      })
    }

    function createJsxFactory() {
      const cache = new Map()

      return new Proxy(styledFn, {
        apply(_, __, args) {
          return styledFn(...args)
        },
        get(_, el) {
          if (!cache.has(el)) {
            cache.set(el, styledFn(el))
          }
          return cache.get(el)
        },
      })
    }

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()

    `,
  }
}
