import type { PropsOf } from '@/lib/components/registry';

/** Big numbers in the heading font; colour is inherited from the Section. */
export function Stats({ stats }: PropsOf<'stats'>) {
  return (
    <dl className="stats-row m-0">
      {stats.map((stat, index) => (
        <div key={index} className="flex flex-col gap-1">
          <dt className="order-2 text-base leading-snug opacity-80">
            {stat.label}
          </dt>
          <dd className="site-heading order-1 m-0 text-6xl leading-none font-bold @xl/page:text-7xl">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
