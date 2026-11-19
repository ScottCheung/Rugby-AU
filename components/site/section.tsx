import type { ComponentRenderer } from './types';

export const Section: ComponentRenderer<'section'> = ({ props, children }) => (
  <section
    className="site-section"
    data-layout={props.layout}
    data-background={props.background}
  >
    <div className="site-section-inner">{children}</div>
  </section>
);
