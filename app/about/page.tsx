import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "掲載データとプライバシー | VideoTrend",
};

export default async function About() {
  await connection();
  const email = process.env.CONTACT_EMAIL?.trim();
  const contact = email && /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/.test(email) ? email : undefined;
  return (
    <main className="content-width max-w-3xl space-y-7 py-9">
      <Link href="/" className="text-sm font-bold text-accent hover:underline">ランキングへ戻る</Link>
      <h1 className="text-3xl font-bold">掲載データとプライバシー</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">ランキングの対象</h2>
        <p>実データ版では、X APIで収集した日本語の動画付き公開投稿の候補を、いいね・リポスト・返信・引用の合計で順位付けします。動画と本文はXの元投稿で確認できます。</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">検索と保存</h2>
        <p>実データ版のキーワードは、掲載中の投稿を絞り込むためサーバーに送信します。「あとで見る」は、投稿の識別子を使っているブラウザに保存します。保存済みの画面から解除できます。</p>
        <p>手選び動画では、サムネイルと再生時の埋め込みプレーヤーを表示するためブラウザからXに接続します。埋め込みとリンク先ではXの利用条件が適用されます。</p>
      </section>
      {contact && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold">掲載に関するお問い合わせ</h2>
          <p>掲載内容や取り下げのご連絡は、対象の投稿URLを添えて <a className="break-all text-accent underline" href={`mailto:${contact}`}>{contact}</a> までお願いします。</p>
        </section>
      )}
    </main>
  );
}
