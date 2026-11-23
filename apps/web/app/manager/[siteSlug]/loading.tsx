import { Card, Skeleton } from '@scottcheung/ui';
import { PageContainer } from '@/components/manager/PageContainer';

// The site's page list, shown at once while its pages are read.
export default function Loading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="flex flex-col gap-3">
        <Skeleton width="5rem" height="0.875rem" />
        <Skeleton width="16rem" height="2.25rem" />
        <Skeleton width="22rem" height="1rem" />
      </div>
      <Skeleton width="24rem" height="2.75rem" style={{ borderRadius: 999 }} />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="flex flex-col gap-2 p-3">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton circle width="2.5rem" height="2.5rem" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton width="40%" height="1rem" />
                <Skeleton width="60%" height="0.75rem" />
              </div>
              <Skeleton width="4.5rem" height="2rem" />
            </div>
          ))}
        </Card>
        <Card className="flex flex-col gap-3">
          <Skeleton width="6rem" height="0.875rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
        </Card>
      </div>
    </PageContainer>
  );
}
