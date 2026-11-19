
import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Pencil,
  MapPin,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../../components/Button';

export function TripDetails({
  trip,
  onBack,
  onRename,
  onDelete,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  busy,
}) {
  const [activity, setActivity] = useState('');
  const [edit, setEdit] = useState(null);
  const [value, setValue] = useState('');

  return (
    <>
      {/* Back navigation */}
      <button className="text-back" onClick={onBack}>
        <ArrowLeft size={17} />
        All trips
      </button>

      {/* Trip header */}
      <div className="detail-header">
        <p className="eyebrow">TRIP OVERVIEW</p>

        <h1>{trip.name}</h1>

        <p className="muted">
          <MapPin size={17} />
          {trip.destination}
        </p>

        <div className="detail-actions">
          <Button
            variant="outline"
            onClick={() => {
              const name = window.prompt('Rename trip', trip.name);
              if (name !== null) onRename(name);
            }}
          >
            <Pencil size={16} />
            Rename
          </Button>

          <Button
            variant="danger"
            onClick={() => {
              if (
                window.confirm(
                  'Delete this trip and all its activities?'
                )
              ) {
                onDelete();
              }
            }}
          >
            <Trash2 size={16} />
            Delete trip
          </Button>
        </div>
      </div>

      {/* Activities section */}
      <section className="detail-panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">YOUR ITINERARY</p>

            <h2>
              Activities{' '}
              <span className="count">
                {trip.activities?.length || 0}
              </span>
            </h2>
          </div>
        </div>

        {/* Empty state */}
        {trip.activities?.length === 0 ? (
          <div className="empty-activities">
            No activities planned yet. Add your first one below.
          </div>
        ) : (
          <div className="activity-list">
            {trip.activities.map((a, i) => (
              <div className="activity-row" key={a.id}>
                <span className="activity-number">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {edit === a.id ? (
                  <>
                    {/* Edit activity */}
                    <input
                      id={`edit-activity-${a.id}`}
                      name="editActivity"
                      aria-label="Edit activity"
                      autoFocus
                      value={value}
                      maxLength={120}
                      onChange={(e) => setValue(e.target.value)}
                    />

                    <button
                      aria-label="Save activity"
                      onClick={() => {
                        onEditActivity(a.id, value);
                        setEdit(null);
                      }}
                    >
                      <Check size={18} />
                    </button>

                    <button
                      aria-label="Cancel edit"
                      onClick={() => setEdit(null)}
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <strong>{a.title}</strong>

                    <button
                      aria-label={`Edit ${a.title}`}
                      onClick={() => {
                        setEdit(a.id);
                        setValue(a.title);
                      }}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      aria-label={`Delete ${a.title}`}
                      onClick={() => onDeleteActivity(a.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add activity form */}
        <form
          className="activity-form"
          onSubmit={(e) => {
            e.preventDefault();
            onAddActivity(activity);
            setActivity('');
          }}
        >
          <input
            id="new-activity"
            name="newActivity"
            aria-label="New activity"
            placeholder="Add an activity, e.g. Visit the Colosseum"
            required
            maxLength={120}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />

          <Button disabled={busy} type="submit">
            <Plus size={18} />
            Add activity
          </Button>
        </form>
      </section>
    </>
  );
}
