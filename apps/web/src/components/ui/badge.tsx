import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30 shadow-[0_0_8px_rgba(0,212,255,0.2)] [a]:hover:bg-[#00d4ff]/25",
        secondary:
          "bg-white/[0.06] text-[#e2e8f0] border-white/10 [a]:hover:bg-white/10",
        destructive:
          "bg-[#ff3355]/15 text-[#ff3355] border-[#ff3355]/30 shadow-[0_0_8px_rgba(255,51,85,0.2)] animate-pulse [a]:hover:bg-[#ff3355]/25",
        outline:
          "border-white/10 text-[#e2e8f0] [a]:hover:bg-white/[0.06]",
        ghost:
          "hover:bg-white/[0.06] hover:text-[#e2e8f0]",
        link: "text-[#00d4ff] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
