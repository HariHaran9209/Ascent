import { Link } from "react-router-dom";

export default function UserCard({ user, onToggleFollow, busy, showPosition = true }) {
  const position = user.position; // pre-computed by parent via getLatestPosition

  return (
    <div className="user-card">
      <Link to={`/u/${user.username}`} className="user-card__left">
        <div className="user-card__avatar">{(user.displayName || user.username)[0].toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="user-card__name">{user.displayName || user.username}</div>
          {showPosition && (
            <div className="user-card__meta">
              {position ? (
                <div className="mini-trail">
                  <span>{position.stageName}</span>
                  <span>·</span>
                  <span>{position.courseName}</span>
                  <span className="mini-trail__bar">
                    <span
                      className="mini-trail__fill"
                      style={{
                        width: `${(position.currentLecture / position.totalLectures) * 100}%`,
                      }}
                    />
                  </span>
                </div>
              ) : (
                <span className="mini-trail">Hasn't started tracking yet</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {onToggleFollow && (
        <button
          className={`btn btn--sm ${user.isFollowing ? "btn--ghost" : "btn--primary"}`}
          onClick={() => onToggleFollow(user)}
          disabled={busy}
        >
          {user.isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
