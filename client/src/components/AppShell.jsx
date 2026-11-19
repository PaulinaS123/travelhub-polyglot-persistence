
import React from 'react';
import {
  Compass,
  Home,
  Plus,
  Database,
  Map,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './Button';

export function AppShell({
  children,
  screen,
  onHome,
  onCreate,
  engine,
  setEngine,
}) {
  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <Compass size={22} />
          </span>
          <strong>
            travelhub<span className="brand-dot">.</span>
          </strong>
        </div>

        <p className="side-label">WORKSPACE</p>

        <nav className="side-nav" aria-label="Main navigation">
          <button className="side-link active" onClick={onHome}>
            <Home size={19} />
            My trips
          </button>

          <button className="side-link" onClick={onCreate}>
            <Plus size={19} />
            Create a trip
          </button>
        </nav>

        {/* Database selection */}
        <div className="side-bottom">
          <div className="database-label">
            <Database size={17} />
            DATABASE MODE
          </div>

          <EngineSelect
            engine={engine}
            setEngine={setEngine}
          />

          <p>SQL and NoSQL store separate trips.</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="app-content">
        <header className="topbar">
          <button
            className="mobile-back"
            type="button"
            aria-label="Back to trips"
            onClick={onHome}
          >
            <ArrowLeft size={21} />
          </button>

          <span className="top-brand">
            <Map size={19} />
            travelhub
          </span>

          <div className="top-actions">
            <span className="desktop-engine">
              Database comparison demo
            </span>

            <span className="avatar" aria-label="Demo user">
              TH
            </span>
          </div>
        </header>

        <main className={`page page--${screen}`}>
          {children}
        </main>

        {/* Mobile navigation */}
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <button
            className={screen === 'list' ? 'selected' : ''}
            onClick={onHome}
          >
            <Home size={20} />
            Trips
          </button>

          <button
            className={screen === 'create' ? 'selected' : ''}
            onClick={onCreate}
          >
            <Plus size={20} />
            New trip
          </button>

          <button onClick={onHome}>
            <Compass size={20} />
            Explore
          </button>
        </nav>
      </div>
    </div>
  );
}

// Database selector
export function EngineSelect({ engine, setEngine }) {
  return (
    <select
      name="databaseEngine"
      aria-label="Select database"
      className="engine-select"
      value={engine}
      onChange={(e) => setEngine(e.target.value)}
    >
      <option value="sql">PostgreSQL · SQL</option>
      <option value="mongo">MongoDB · NoSQL</option>
    </select>
  );
}
