// 星光農莊擴充 Canonical 資產定義。
// 每一筆資產都明確定義用途、輪廓與比例；禁止只換色或亂數種子冒充新資產。

const defineAsset = (id, label, family, tier, group) => Object.freeze({
  id, assetId: `farm:${id}`, label, family, tier, group,
  canonicalPath: `models/farm/${group}/${id}.glb`,
  materialProfile: group === 'crops' ? 'crop-animal-generated' : group === 'tools' ? 'farm-tool-generated' : group === 'crops' ? 'crop-animal-generated' : 'farm-atlas-generated',
  lodProfile: tier === 'hero' ? 'building-hero' : tier === 'ambient' ? 'environment-light' : 'environment-standard',
  purpose: label, silhouette: family, proportion: tier === 'hero' ? 'hero-scale' : tier === 'ambient' ? 'small-prop' : 'medium-prop',
});

export const FARM_EXPANSION_ASSET_DEFINITIONS_TOOLS = Object.freeze([
  defineAsset("tool_hoe", "鋤頭", "tool_hoe", "gameplay", "tools"),
  defineAsset("tool_watering_can", "澆水壺", "tool_watering_can", "gameplay", "tools"),
  defineAsset("tool_seed_bag", "種子袋", "tool_seed_bag", "gameplay", "tools"),
  defineAsset("tool_sickle", "鐮刀", "tool_sickle", "gameplay", "tools"),
  defineAsset("tool_axe", "斧頭", "tool_axe", "gameplay", "tools"),
  defineAsset("tool_pickaxe", "十字鎬", "tool_pickaxe", "gameplay", "tools"),
  defineAsset("tool_hammer", "工程槌", "tool_hammer", "gameplay", "tools"),
  defineAsset("tool_fishing_rod", "釣竿", "tool_fishing_rod", "gameplay", "tools"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_CROPS = Object.freeze([
  defineAsset("crop_wheat_seed", "wheat_seed", "crop_seed", "ambient", "crops"),
  defineAsset("crop_wheat_sprout", "wheat_sprout", "crop_sprout", "ambient", "crops"),
  defineAsset("crop_wheat_growing", "wheat_growing", "crop_growing", "ambient", "crops"),
  defineAsset("crop_wheat_mature", "wheat_mature", "crop_mature", "ambient", "crops"),
  defineAsset("crop_carrot_seed", "carrot_seed", "crop_seed", "ambient", "crops"),
  defineAsset("crop_carrot_sprout", "carrot_sprout", "crop_sprout", "ambient", "crops"),
  defineAsset("crop_carrot_growing", "carrot_growing", "crop_growing", "ambient", "crops"),
  defineAsset("crop_carrot_mature", "carrot_mature", "crop_mature", "ambient", "crops"),
  defineAsset("crop_tomato_seed", "tomato_seed", "crop_seed", "ambient", "crops"),
  defineAsset("crop_tomato_sprout", "tomato_sprout", "crop_sprout", "ambient", "crops"),
  defineAsset("crop_tomato_growing", "tomato_growing", "crop_growing", "ambient", "crops"),
  defineAsset("crop_tomato_mature", "tomato_mature", "crop_mature", "ambient", "crops"),
  defineAsset("crop_pumpkin_seed", "pumpkin_seed", "crop_seed", "ambient", "crops"),
  defineAsset("crop_pumpkin_sprout", "pumpkin_sprout", "crop_sprout", "ambient", "crops"),
  defineAsset("crop_pumpkin_growing", "pumpkin_growing", "crop_growing", "ambient", "crops"),
  defineAsset("crop_pumpkin_mature", "pumpkin_mature", "crop_mature", "ambient", "crops"),
  defineAsset("crop_strawberry_seed", "strawberry_seed", "crop_seed", "ambient", "crops"),
  defineAsset("crop_strawberry_sprout", "strawberry_sprout", "crop_sprout", "ambient", "crops"),
  defineAsset("crop_strawberry_growing", "strawberry_growing", "crop_growing", "ambient", "crops"),
  defineAsset("crop_strawberry_mature", "strawberry_mature", "crop_mature", "ambient", "crops"),
  defineAsset("crop_corn_seed", "corn_seed", "crop_seed", "ambient", "crops"),
  defineAsset("crop_corn_sprout", "corn_sprout", "crop_sprout", "ambient", "crops"),
  defineAsset("crop_corn_growing", "corn_growing", "crop_growing", "ambient", "crops"),
  defineAsset("crop_corn_mature", "corn_mature", "crop_mature", "ambient", "crops"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_ANIMALFACILITIES = Object.freeze([
  defineAsset("chicken_coop", "雞舍", "animal_facility", "hero", "animalFacilities"),
  defineAsset("sheep_shelter", "羊棚", "animal_facility", "hero", "animalFacilities"),
  defineAsset("cow_shed", "牛舍", "animal_facility", "hero", "animalFacilities"),
  defineAsset("animal_feeder", "飼料槽", "feeder", "gameplay", "animalFacilities"),
  defineAsset("animal_waterer", "動物飲水器", "waterer", "gameplay", "animalFacilities"),
  defineAsset("nesting_box", "產蛋箱", "nesting_box", "gameplay", "animalFacilities"),
  defineAsset("milking_station", "擠乳台", "milking", "gameplay", "animalFacilities"),
  defineAsset("grooming_post", "梳洗柱", "grooming", "gameplay", "animalFacilities"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_PROCESSING = Object.freeze([
  defineAsset("grain_mill", "穀物磨坊", "processing_machine", "hero", "processing"),
  defineAsset("cheese_press", "起司壓製機", "processing_machine", "gameplay", "processing"),
  defineAsset("butter_churn", "奶油攪拌桶", "processing_machine", "gameplay", "processing"),
  defineAsset("jam_kettle", "果醬鍋", "processing_machine", "gameplay", "processing"),
  defineAsset("loom", "織布機", "processing_machine", "gameplay", "processing"),
  defineAsset("smoker", "煙燻爐", "processing_machine", "gameplay", "processing"),
  defineAsset("dehydrator", "乾燥機", "processing_machine", "gameplay", "processing"),
  defineAsset("flour_sifter", "麵粉篩", "processing_machine", "gameplay", "processing"),
  defineAsset("packing_table", "包裝台", "processing_machine", "gameplay", "processing"),
  defineAsset("cold_storage", "冷藏櫃", "processing_machine", "hero", "processing"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_FIELD = Object.freeze([
  defineAsset("irrigation_pump", "灌溉幫浦", "irrigation", "gameplay", "field"),
  defineAsset("sprinkler", "灑水器", "irrigation", "gameplay", "field"),
  defineAsset("canal_gate", "水渠閘門", "irrigation", "gameplay", "field"),
  defineAsset("compost_bin", "堆肥箱", "compost", "gameplay", "field"),
  defineAsset("scarecrow", "稻草人", "scarecrow", "gameplay", "field"),
  defineAsset("field_sign", "田區標示牌", "signpost", "ambient", "field"),
  defineAsset("seedling_tray", "育苗盤", "seedling", "gameplay", "field"),
  defineAsset("tool_shed", "工具棚", "tool_shed", "hero", "field"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_SHIPPING = Object.freeze([
  defineAsset("shipping_crate", "出貨箱", "crate", "gameplay", "shipping"),
  defineAsset("shipping_scale", "出貨磅秤", "scale", "gameplay", "shipping"),
  defineAsset("produce_cart", "農產推車", "cart", "gameplay", "shipping"),
  defineAsset("orchard_ladder", "果園梯", "ladder", "gameplay", "shipping"),
  defineAsset("fruit_basket", "水果籃", "basket", "ambient", "shipping"),
  defineAsset("bee_hive", "蜂箱", "bee_hive", "gameplay", "shipping"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_UPGRADES = Object.freeze([
  defineAsset("greenhouse", "溫室", "greenhouse", "hero", "upgrades"),
  defineAsset("grain_silo", "穀倉筒倉", "silo", "hero", "upgrades"),
  defineAsset("rain_collector", "雨水收集器", "collector", "gameplay", "upgrades"),
  defineAsset("solar_dryer", "太陽能乾燥架", "dryer", "gameplay", "upgrades"),
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS = Object.freeze([
  ...FARM_EXPANSION_ASSET_DEFINITIONS_TOOLS,
  ...FARM_EXPANSION_ASSET_DEFINITIONS_CROPS,
  ...FARM_EXPANSION_ASSET_DEFINITIONS_ANIMALFACILITIES,
  ...FARM_EXPANSION_ASSET_DEFINITIONS_PROCESSING,
  ...FARM_EXPANSION_ASSET_DEFINITIONS_FIELD,
  ...FARM_EXPANSION_ASSET_DEFINITIONS_SHIPPING,
  ...FARM_EXPANSION_ASSET_DEFINITIONS_UPGRADES,
]);

export const FARM_EXPANSION_ASSET_DEFINITIONS_BY_ID = Object.freeze(Object.fromEntries(FARM_EXPANSION_ASSET_DEFINITIONS.map((asset) => [asset.id, asset])));
export const FARM_EXPANSION_ASSET_DEFINITIONS_COUNT = FARM_EXPANSION_ASSET_DEFINITIONS.length;
