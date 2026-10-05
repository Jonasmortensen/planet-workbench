import { kindOf } from '../../generator';
import { useBundle } from '../context';
import { BATCH_VIEW, RELATIONS_VIEW, VALIDATION_VIEW } from '../components/Sidebar';
import { BatchPage } from './BatchPage';
import { ValidationPage } from './ValidationPage';
import { CountryPage } from './CountryPage';
import { NpcPage } from './NpcPage';
import { OrganizationPage } from './OrganizationPage';
import { LanguagePage, ReligionPage, SpeciesPage } from './PeoplePages';
import { PlanetPage } from './PlanetPage';
import { RelationsPage } from './RelationsPage';
import { SettlementPage } from './SettlementPage';

/** Picks the page for the selected entity id. */
export function EntityPage() {
  const { bundle, selectedId } = useBundle();
  if (!selectedId) return <PlanetPage />;
  if (selectedId === RELATIONS_VIEW) return <RelationsPage />;
  if (selectedId === VALIDATION_VIEW) return <ValidationPage />;
  if (selectedId === BATCH_VIEW) return <BatchPage />;
  switch (kindOf(selectedId)) {
    case 'country':
      if (bundle.countries[selectedId]) return <CountryPage key={selectedId} country={bundle.countries[selectedId]} />;
      break;
    case 'settlement':
      if (bundle.settlements[selectedId]) return <SettlementPage key={selectedId} settlement={bundle.settlements[selectedId]} />;
      break;
    case 'organization':
      if (bundle.organizations[selectedId]) return <OrganizationPage key={selectedId} org={bundle.organizations[selectedId]} />;
      break;
    case 'npc':
      if (bundle.npcs[selectedId]) return <NpcPage key={selectedId} npc={bundle.npcs[selectedId]} />;
      break;
    case 'species':
      if (bundle.species[selectedId]) return <SpeciesPage key={selectedId} species={bundle.species[selectedId]} />;
      break;
    case 'language':
      if (bundle.languages[selectedId]) return <LanguagePage key={selectedId} language={bundle.languages[selectedId]} />;
      break;
    case 'religion':
      if (bundle.religions[selectedId]) return <ReligionPage key={selectedId} religion={bundle.religions[selectedId]} />;
      break;
    case 'planet':
      return <PlanetPage />;
    default:
      break;
  }
  return (
    <div className="entity-header">
      <h1>Not found</h1>
      <p className="muted">No entity with id <code>{selectedId}</code> exists in this planet.</p>
    </div>
  );
}
