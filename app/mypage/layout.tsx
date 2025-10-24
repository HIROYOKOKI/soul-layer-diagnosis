// app/mypage/layout.tsx
import React from 'react';

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    // 親レイアウトの max-width を打ち消すフルブリード領域
    <section className="w-full">
      {/* ビューポート基準の負マージンで祖先の max-w を突破 */}
      <div className="mx-[calc(50%-50vw)]">
        {/* ここからは /mypage 専用の理想幅で再センタリング */}
        <div className="mx-auto w-full max-w-[960px] md:max-w-[1040px] lg:max-w-[1120px] px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </section>
  );
}
