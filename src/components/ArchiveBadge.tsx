import { FiArchive } from 'react-icons/fi';
import type { ArchiveMeta } from '../types';

interface ArchiveBadgeProps {
  meta: ArchiveMeta | null;
  onShowBeyondSource: (floorDate: string) => void;
}

/**
 * States the one thing that makes this archive worth visiting.
 *
 * DSE drops announcements from its own site after two years. Everything older
 * than that boundary exists here and, publicly, nowhere else — but a visitor
 * has no way to know that, and it is the whole reason the project exists. The
 * count is clickable so the claim can be checked rather than taken on trust.
 */
const ArchiveBadge = ({ meta, onShowBeyondSource }: ArchiveBadgeProps) => {
  if (!meta?.beyondSourceCount || !meta.sourceFloorDate) return null;

  return (
    <button
      onClick={() => onShowBeyondSource(meta.sourceFloorDate!)}
      title={`Show the ${meta.beyondSourceCount} announcements published before ${meta.sourceFloorDate}, the point where DSE's own archive now ends`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        width: '100%',
        textAlign: 'left',
        background: 'linear-gradient(90deg, rgba(77,163,255,0.10), rgba(77,163,255,0.02))',
        border: '1px solid rgba(77,163,255,0.22)',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        padding: '8px 14px',
        fontSize: '0.82rem',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <FiArchive size={14} aria-hidden="true" style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
      <span>
        <strong className="text-gradient">{meta.beyondSourceCount.toLocaleString()}</strong>{' '}
        of these announcements have been removed from DSE&rsquo;s own website.
        They survive here.
      </span>
      <span style={{ marginLeft: 'auto', color: 'var(--accent-blue)', whiteSpace: 'nowrap', fontWeight: 600 }}>
        See them →
      </span>
    </button>
  );
};

export default ArchiveBadge;
