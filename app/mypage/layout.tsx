import React from "react";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full overflow-x-clip">
      <div className="mx-[calc(50%-50vw)]">
        <div className="mx-auto w-full max-w-[960px] md:max-w-[1040px] lg:max-w-[1120px] px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </section>
  );
}
