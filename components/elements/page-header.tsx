import { ReactNode } from "react"

export const PageHeader = ({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string
  title: string
  lead?: ReactNode
}) => (
  <header className="page-header">
    {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
    <h1 className="page-header__title">{title}</h1>
    {lead && <p className="page-header__lead">{lead}</p>}
  </header>
)

export const Section = ({
  eyebrow,
  title,
  more,
  children,
}: {
  eyebrow?: string
  title: string
  more?: ReactNode
  children: ReactNode
}) => (
  <section className="section">
    <div className="section__head">
      <div>
        {eyebrow && <p className="section__eyebrow">{eyebrow}</p>}
        <h2 className="section__title">{title}</h2>
      </div>
      {more && <div className="section__more">{more}</div>}
    </div>
    {children}
  </section>
)
