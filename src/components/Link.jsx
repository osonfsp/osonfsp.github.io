import { navigate } from "../lib/router";

export function Link({ href: e, onClick: t, children: a, ...n }) {
  return (
    <a
      href={`#${e}`}
      {...n}
      onClick={(i) => {
        if ((t?.(i), i.defaultPrevented || i.metaKey || i.ctrlKey || i.shiftKey)) return;
        (i.preventDefault(), navigate(e));
      }}
    >
      {a}
    </a>
  );
}
