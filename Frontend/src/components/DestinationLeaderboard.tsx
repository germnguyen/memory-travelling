import React, { useState } from "react";
import type { Destination } from "../types";

const INITIAL_DESTINATIONS: Destination[] = [
  {
    id: "taxua",
    rank: 1,
    name: "Tà Xùa",
    province: "Sơn La",
    memoriesCount: 342,
    trendingDelta: 12,
    tag: "Săn mây",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "hagiang",
    rank: 2,
    name: "Hà Giang",
    province: "Đồng Văn, Mèo Vạc",
    memoriesCount: 298,
    trendingDelta: 8,
    tag: "Phượt đèo",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "danang",
    rank: 3,
    name: "Đà Nẵng & Hội An",
    province: "Quảng Nam",
    memoriesCount: 275,
    trendingDelta: 6,
    tag: "Biển & Phố cổ",
    imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "dalat",
    rank: 4,
    name: "Đà Lạt",
    province: "Lâm Đồng",
    memoriesCount: 240,
    trendingDelta: 5,
    tag: "Hoa & Sương mù",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "phuquoc",
    rank: 5,
    name: "Phú Quốc",
    province: "Kiên Giang",
    memoriesCount: 198,
    trendingDelta: 3,
    tag: "Hoàng hôn biển",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "ninhbinh",
    rank: 6,
    name: "Tràng An - Tam Cốc",
    province: "Ninh Bình",
    memoriesCount: 165,
    trendingDelta: 2,
    tag: "Di sản non nước",
    imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=120&q=80",
  },
];

export const DestinationLeaderboard: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const handleVote = (id: string) => {
    setDestinations((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const isVoted = votedIds.has(id);
          return {
            ...d,
            memoriesCount: isVoted ? d.memoriesCount - 1 : d.memoriesCount + 1,
            trendingDelta: isVoted ? d.trendingDelta - 1 : d.trendingDelta + 1,
          };
        }
        return d;
      })
    );

    setVotedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section id="leaderboard" className="px-5 py-16 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Concept description like Context-con */}
        <div data-reveal className="lg:col-span-5 flex flex-col">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10b981]/10 text-[#10b981] font-bold text-lg mb-4">
            ✓
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-[#10b981]">
            Bình chọn cộng đồng
          </h3>

          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 leading-tight">
            Điểm đến tiếp theo bạn muốn đặt chân tới?
          </h2>

          <p className="mt-4 text-base text-neutral-500 leading-relaxed">
            Mỗi người dùng có thể bình chọn và chia sẻ kỷ niệm tại các vùng đất yêu thích. Điểm đến nhận nhiều bình chọn nhất sẽ được cộng đồng ưu tiên tổ chức offline và xuất bản cẩm nang du lịch độc quyền.
          </p>

          <ul data-reveal-items className="mt-6 space-y-3 text-sm text-neutral-700 font-medium">
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold">
                ✓
              </span>
              <span>Cập nhật bảng xếp hạng toạ độ theo thời gian thực</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold">
                ✓
              </span>
              <span>Tích hợp toạ độ GPS chính xác và ảnh chụp thực tế</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold">
                ✓
              </span>
              <span>Hoàn toàn miễn phí và mở cho tất cả người yêu du lịch</span>
            </li>
          </ul>

          <div className="mt-8">
            <span className="inline-block rounded-2xl bg-neutral-100 p-4 border border-neutral-200/60 text-xs text-neutral-600">
              💡 <strong>Mẹo:</strong> Bấm nút <strong>Vote</strong> ở từng địa danh để bình chọn hoặc huỷ bình chọn bất kỳ lúc nào.
            </span>
          </div>
        </div>

        {/* Right Column: Leaderboard list (exact style from context-con.com) */}
        <div data-reveal className="lg:col-span-7">
          <div className="rounded-3xl bg-white border border-black/10 overflow-hidden shadow-lg divide-y divide-neutral-100">
            {destinations.map((dest) => {
              const isVoted = votedIds.has(dest.id);

              return (
                <div
                  key={dest.id}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-neutral-50/80 transition"
                >
                  {/* Rank number */}
                  <span className="w-5 text-sm font-bold text-neutral-400 tabular-nums">
                    {dest.rank}
                  </span>

                  {/* Thumbnail */}
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="h-10 w-10 rounded-xl object-cover border border-neutral-200 shrink-0"
                  />

                  {/* Destination Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-neutral-900 truncate text-sm sm:text-base">
                        {dest.name}
                      </p>
                      <span className="hidden sm:inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                        {dest.tag}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{dest.province}</p>
                  </div>

                  {/* Memories Count */}
                  <div className="text-right">
                    <p className="font-bold text-neutral-900 tabular-nums text-sm sm:text-base">
                      {dest.memoriesCount}
                    </p>
                    <p className="text-[10px] text-neutral-400">bình chọn</p>
                  </div>

                  {/* Trending Delta badge */}
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums text-[#ff4d1a] bg-[#ff4d1a]/10 px-2 py-1 rounded-full">
                    <span>▲</span>
                    <span>+{dest.trendingDelta}</span>
                  </span>

                  {/* Vote Button */}
                  <button
                    type="button"
                    onClick={() => handleVote(dest.id)}
                    className={`ml-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-[0.96] ${
                      isVoted
                        ? "bg-[#ff4d1a] text-white shadow-xs"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {isVoted ? "Đã vote ✓" : "Vote"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
