import { useState } from "react";
import { useParams } from "react-router-dom";
import { color, font, radius } from "../theme";
import { useSession } from "../hooks/useSession";
import { useGroup } from "../hooks/useGroups";
import { useDailyGame } from "../hooks/useDailyGame";
import { useMyTodayPlays, attemptsRemaining, bestScore, useSubmitPlay } from "../hooks/usePlays";
import { useGroupRanking } from "../hooks/useGroupRanking";
import { CategoryBadge } from "../components/CategoryBadge";
import { AttemptsBadge } from "../components/AttemptsBadge";
import { PrimaryButton } from "../components/PrimaryButton";
import { GamePlayer } from "../components/GamePlayer";
import { Podium } from "../components/Podium";
import { RankingList } from "../components/RankingList";
import { ChatTab } from "../components/ChatTab";
import { CountdownChip } from "../components/CountdownChip";
import { Confetti } from "../components/Confetti";
import { GAME_META, CATEGORY_SPLIT } from "../lib/categories";
import { computeBonus } from "../lib/daily";

type Tab = "hoy" | "ranking" | "chat";

const TAB_LABEL: Record<Tab, string> = { hoy: "Hoy", ranking: "Ranking", chat: "Chat" };

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { data: group, isLoading: groupLoading } = useGroup(id);
  const { data: dailyGame, isLoading: dailyLoading } = useDailyGame(group?.categoria);
  const { data: plays } = useMyTodayPlays(id);
  const { data: ranking, refetch: refetchRanking } = useGroupRanking(id);
  const submitPlay = useSubmitPlay(id, dailyGame?.game_id);
  const [tab, setTab] = useState<Tab>("hoy");
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{ score: number; secs: number | null } | null>(null);
  const [confettiBurst, setConfettiBurst] = useState(0);

  if (groupLoading || !group) {
    return <div style={{ padding: 20, fontFamily: font.body, color: color.tintaSuave }}>Cargando…</div>;
  }

  const gameMeta = dailyGame ? GAME_META[dailyGame.game_id] : undefined;
  const remaining = attemptsRemaining(plays ?? []);
  const best = bestScore(plays ?? []);
  const bonus = lastResult ? computeBonus(gameMeta?.par ?? null, lastResult.secs) : null;
  const [splitA, splitB] = CATEGORY_SPLIT[group.categoria];

  const handleGameOver = async (result: { score: number; secs: number | null }) => {
    setPlaying(false);
    setLastResult(result);
    await submitPlay.mutateAsync(result);
    const { data: freshRanking } = await refetchRanking();
    if (freshRanking?.[0]?.userId && freshRanking[0].userId === session?.user.id) {
      setConfettiBurst((n) => n + 1);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: color.fondo }}>
      <Confetti burstKey={confettiBurst} />
      <div style={{ padding: 20 }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 24, color: color.tinta }}>
          {group.nombre}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
          <CategoryBadge categoria={group.categoria} />
          <AttemptsBadge remaining={remaining} />
        </div>
        <div style={{ fontFamily: font.mono, fontSize: 12, color: color.muted, marginTop: 6 }}>
          Código de invitación: {group.invite_code}
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${color.linea}`, padding: "0 20px" }}>
        {(["hoy", "ranking", "chat"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: 14,
              color: tab === t ? color.azul : color.tintaSuave,
              borderBottom: tab === t ? `2px solid ${color.azul}` : "2px solid transparent",
            }}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "ranking" && (
        <div style={{ padding: 20 }}>
          {ranking && ranking.length > 0 ? (
            <>
              <Podium entries={ranking} />
              <RankingList entries={ranking} />
            </>
          ) : (
            <div style={{ fontFamily: font.body, color: color.tintaSuave, textAlign: "center" }}>Cargando ranking…</div>
          )}
        </div>
      )}

      {tab === "chat" && id && (
        <div style={{ padding: "0 20px 20px" }}>
          <ChatTab groupId={id} />
        </div>
      )}

      {tab === "hoy" && (
        <div style={{ padding: 20 }}>
          {dailyLoading && (
            <div style={{ fontFamily: font.body, color: color.tintaSuave }}>Cargando el reto de hoy…</div>
          )}

          {!dailyLoading && !dailyGame && (
            <div style={{ fontFamily: font.body, color: color.tintaSuave }}>
              Todavía no hay reto sembrado para hoy en esta categoría.
            </div>
          )}

          {dailyGame && !playing && (
            <div style={{ border: `1px solid ${color.linea}`, borderRadius: radius, overflow: "hidden" }}>
              {/* Carta HOY protagonista: split diagonal 50/50 de los dos primarios de la categoría. */}
              <div
                style={{
                  position: "relative",
                  height: 156,
                  background: `linear-gradient(135deg, ${splitA} 50%, ${splitB} 50%)`,
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 10, right: 10 }}>
                  <AttemptsBadge remaining={remaining} variant="overlay" />
                </div>
                <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                  <CountdownChip />
                </div>
                <div style={{ fontSize: 64, filter: `drop-shadow(0 4px 10px ${color.scrim})` }}>
                  {gameMeta?.emoji ?? "🎮"}
                </div>
              </div>

              <div style={{ background: color.card, padding: 20 }}>
                <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: color.tinta, marginBottom: 4 }}>
                  {gameMeta?.nombre ?? dailyGame.game_id}
                </div>
                {best != null && (
                  <div style={{ fontFamily: font.mono, fontSize: 13, color: color.tintaSuave, marginBottom: 12 }}>
                    Tu mejor marca hoy: {best} pts
                  </div>
                )}
                {lastResult && (
                  <div style={{ fontFamily: font.body, fontSize: 13, color: color.tinta, marginBottom: 12 }}>
                    Última partida: {lastResult.score} pts
                    {lastResult.secs != null ? ` · ⏱${lastResult.secs}s` : ""}
                    {bonus ? ` · +${bonus} bonus` : ""}
                  </div>
                )}
                <PrimaryButton onClick={() => setPlaying(true)} disabled={remaining <= 0}>
                  {remaining <= 0 ? "Sin intentos hoy" : "▶ Jugar"}
                </PrimaryButton>
              </div>
            </div>
          )}

          {dailyGame && playing && (
            <GamePlayer
              gameId={dailyGame.game_id}
              seed={dailyGame.seed}
              parSegundos={gameMeta?.par ?? null}
              onGameOver={handleGameOver}
            />
          )}
        </div>
      )}
    </div>
  );
}
