import { Skeleton } from '@scottcheung/ui';
import { PageContainer } from '@/components/manager/PageContainer';

// The sites dashboard, shown at once while the sites are read.
export default function Loading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="flex flex-col gap-3">
        <Skeleton width="12rem" height="2.25rem" />
        <Skeleton width="24rem" height="1rem" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} height="14rem" style={{ borderRadius: 24 }} />
        ))}
      </div>
    </PageContainer>
  );
}
