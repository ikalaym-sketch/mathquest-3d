// v0.4.0 面板總機：依 activePanel 渲染對應面板
import { useStore } from '../../store/useStore.js';
import InventoryPanel from './InventoryPanel.jsx';
import EquipmentPanel from './EquipmentPanel.jsx';
import ShopPanel from './ShopPanel.jsx';
import BlacksmithPanel from './BlacksmithPanel.jsx';
import CarpenterPanel from './CarpenterPanel.jsx';
import BuildPanel from './BuildPanel.jsx';
import MachinePanel from './MachinePanel.jsx';
import SeedPickerPanel from './SeedPickerPanel.jsx';
import JournalPanel from './JournalPanel.jsx';
import RenderSettingsPanel from './RenderSettingsPanel.jsx';
import HomeDecorPanel from './HomeDecorPanel.jsx';
import HomeInteriorPanel from './HomeInteriorPanel.jsx';
import RegionWorkshopPanel from './RegionWorkshopPanel.jsx';
import RegionMechanicChallengePanel from '../RegionMechanics/RegionMechanicChallengePanel.jsx';
import AccessibilitySettingsPanel from './AccessibilitySettingsPanel.jsx';
import AnimalCarePanel from './AnimalCarePanel.jsx';
import FishingPanel from './FishingPanel.jsx';
import VillageBoardPanel from './VillageBoardPanel.jsx';
import VillageRelationsPanel from './VillageRelationsPanel.jsx';
import CompanionRosterPanel from './CompanionRosterPanel.jsx';

export default function PanelHost() {
  const panel = useStore((s) => s.activePanel);
  switch (panel) {
    case 'inventory':
      return <InventoryPanel />;
    case 'equipment':
      return <EquipmentPanel />;
    case 'shop':
      return <ShopPanel />;
    case 'blacksmith':
      return <BlacksmithPanel />;
    case 'carpenter':
      return <CarpenterPanel />;
    case 'build':
      return <BuildPanel />;
    case 'machine':
      return <MachinePanel />;
    case 'seedpicker':
      return <SeedPickerPanel />;
    case 'journal':
      return <JournalPanel />;
    case 'renderSettings':
      return <RenderSettingsPanel />;
    case 'homeInterior':
      return <HomeInteriorPanel />;
    case 'homeDecor':
      return <HomeDecorPanel />;
    case 'regionWorkshop':
      return <RegionWorkshopPanel />;
    case 'regionMechanic':
      return <RegionMechanicChallengePanel />;
    case 'accessibility':
      return <AccessibilitySettingsPanel />;
    case 'animalcare':
      return <AnimalCarePanel />;
    case 'fishing':
      return <FishingPanel />;
    case 'companion':
      return <CompanionRosterPanel />;
    case 'villageRelations':
      return <VillageRelationsPanel />;
    case 'villageBoard':
      return <VillageBoardPanel />;
    default:
      return null;
  }
}
