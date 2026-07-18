// 星光村 Canonical 資產定義。
// 每一筆資產都明確定義用途、輪廓與比例；禁止只換色或亂數種子冒充新資產。

const defineAsset = (id, label, family, tier, group) => Object.freeze({
  id, assetId: `village:${id}`, label, family, tier, group,
  canonicalPath: `models/village/${group}/${id}.glb`,
  materialProfile: 'village-generated',
  lodProfile: tier === 'hero' ? 'building-hero' : tier === 'ambient' ? 'environment-light' : 'environment-standard',
  purpose: label, silhouette: family, proportion: tier === 'hero' ? 'hero-scale' : tier === 'ambient' ? 'small-prop' : 'medium-prop',
});

export const VILLAGE_ASSET_DEFINITIONS_BUILDINGS = Object.freeze([
  defineAsset("town_hall", "星光村公所", "building_civic", "hero", "buildings"),
  defineAsset("general_store", "雜貨商店", "building_shop", "hero", "buildings"),
  defineAsset("potion_shop", "藥水小屋", "building_shop", "hero", "buildings"),
  defineAsset("bakery", "星麥坊", "building_shop", "hero", "buildings"),
  defineAsset("blacksmith", "鐵匠鋪", "building_workshop", "hero", "buildings"),
  defineAsset("carpenter", "木工坊", "building_workshop", "hero", "buildings"),
  defineAsset("tailor", "裁縫屋", "building_workshop", "hero", "buildings"),
  defineAsset("resident_house_a", "住宅A", "building_home", "hero", "buildings"),
  defineAsset("resident_house_b", "住宅B", "building_home", "hero", "buildings"),
  defineAsset("resident_house_c", "住宅C", "building_home", "hero", "buildings"),
  defineAsset("learning_hall", "星光學習館", "building_learning", "hero", "buildings"),
]);

export const VILLAGE_ASSET_DEFINITIONS_MODULAR = Object.freeze([
  defineAsset("wall_panel", "牆板", "module_wall", "modular", "modular"),
  defineAsset("roof_panel", "屋頂模組", "module_roof", "modular", "modular"),
  defineAsset("door_frame", "門框", "module_door", "modular", "modular"),
  defineAsset("window_frame", "窗框", "module_window", "modular", "modular"),
  defineAsset("chimney_module", "煙囪", "module_chimney", "modular", "modular"),
  defineAsset("sign_frame", "招牌框", "module_sign", "modular", "modular"),
]);

export const VILLAGE_ASSET_DEFINITIONS_MARKETWORKSHOP = Object.freeze([
  defineAsset("market_stall_a", "市場攤位A", "stall", "gameplay", "marketWorkshop"),
  defineAsset("market_stall_b", "市場攤位B", "stall", "gameplay", "marketWorkshop"),
  defineAsset("produce_crate", "蔬果木箱", "crate", "gameplay", "marketWorkshop"),
  defineAsset("cloth_roll", "布卷架", "rack", "gameplay", "marketWorkshop"),
  defineAsset("anvil", "鐵砧", "forge_prop", "gameplay", "marketWorkshop"),
  defineAsset("forge", "鍛造爐", "forge_prop", "gameplay", "marketWorkshop"),
  defineAsset("workbench", "工作台", "workbench", "gameplay", "marketWorkshop"),
  defineAsset("tool_rack", "工具架", "rack", "gameplay", "marketWorkshop"),
  defineAsset("lumber_stack", "木料堆", "stack", "gameplay", "marketWorkshop"),
  defineAsset("pottery_shelf", "陶器架", "shelf", "gameplay", "marketWorkshop"),
  defineAsset("delivery_cart", "送貨推車", "cart", "gameplay", "marketWorkshop"),
  defineAsset("notice_kiosk", "公告亭", "kiosk", "gameplay", "marketWorkshop"),
]);

export const VILLAGE_ASSET_DEFINITIONS_RESIDENTIALLEARNING = Object.freeze([
  defineAsset("bed", "床鋪", "furniture", "gameplay", "residentialLearning"),
  defineAsset("table", "餐桌", "furniture", "gameplay", "residentialLearning"),
  defineAsset("chair", "椅子", "furniture", "gameplay", "residentialLearning"),
  defineAsset("wardrobe", "衣櫃", "furniture", "gameplay", "residentialLearning"),
  defineAsset("bookshelf", "書架", "furniture", "gameplay", "residentialLearning"),
  defineAsset("study_desk", "學習桌", "furniture", "gameplay", "residentialLearning"),
  defineAsset("chalkboard", "黑板", "learning_prop", "gameplay", "residentialLearning"),
  defineAsset("abacus", "算盤", "learning_prop", "gameplay", "residentialLearning"),
  defineAsset("globe", "地球儀", "learning_prop", "gameplay", "residentialLearning"),
  defineAsset("reading_cushion", "閱讀坐墊", "furniture", "gameplay", "residentialLearning"),
  defineAsset("toy_chest", "玩具箱", "furniture", "gameplay", "residentialLearning"),
  defineAsset("study_lamp", "學習燈", "lamp", "gameplay", "residentialLearning"),
]);

export const VILLAGE_ASSET_DEFINITIONS_CIVIC = Object.freeze([
  defineAsset("star_tree", "星光樹", "landmark_tree", "hero", "civic"),
  defineAsset("fountain", "星光噴泉", "landmark_fountain", "hero", "civic"),
  defineAsset("quest_board", "任務布告欄", "board", "gameplay", "civic"),
  defineAsset("village_gate", "村莊大門", "gate", "hero", "civic"),
  defineAsset("teleport_plinth", "傳送台座", "portal", "gameplay", "civic"),
  defineAsset("clock_tower", "鐘塔", "tower", "hero", "civic"),
  defineAsset("village_statue", "村莊雕像", "statue", "hero", "civic"),
  defineAsset("stone_well", "石井", "well", "gameplay", "civic"),
  defineAsset("pond_bridge", "池塘紅橋", "bridge", "hero", "civic"),
  defineAsset("festival_stage", "節慶舞台", "stage", "hero", "civic"),
]);

export const VILLAGE_ASSET_DEFINITIONS_EXTERIOR = Object.freeze([
  defineAsset("bench", "長椅", "bench", "gameplay", "exterior"),
  defineAsset("lamp_post", "路燈", "lamp", "gameplay", "exterior"),
  defineAsset("flower_planter", "花盆", "planter", "ambient", "exterior"),
  defineAsset("barrel", "木桶", "barrel", "ambient", "exterior"),
  defineAsset("crate", "木箱", "crate", "ambient", "exterior"),
  defineAsset("fence_segment", "柵欄", "fence", "ambient", "exterior"),
  defineAsset("fence_gate", "柵欄門", "fence_gate", "gameplay", "exterior"),
  defineAsset("mailbox", "信箱", "mailbox", "gameplay", "exterior"),
  defineAsset("signpost", "路標", "signpost", "gameplay", "exterior"),
  defineAsset("lantern_string", "燈籠串", "lantern_string", "ambient", "exterior"),
  defineAsset("banner_post", "旗幟柱", "banner", "ambient", "exterior"),
  defineAsset("planter_box", "花槽", "planter", "ambient", "exterior"),
  defineAsset("water_trough", "飲水槽", "trough", "gameplay", "exterior"),
  defineAsset("birdhouse", "鳥屋", "birdhouse", "ambient", "exterior"),
  defineAsset("waste_bin", "分類箱", "bin", "ambient", "exterior"),
]);

export const VILLAGE_ASSET_DEFINITIONS_ACTIVITY = Object.freeze([
  defineAsset("balloon_altar", "氣球祭壇", "altar", "hero", "activity"),
  defineAsset("fishing_rack", "釣具架", "rack", "gameplay", "activity"),
  defineAsset("cooking_stove", "戶外爐台", "stove", "gameplay", "activity"),
  defineAsset("picnic_set", "野餐組", "picnic", "gameplay", "activity"),
  defineAsset("laundry_line", "曬衣架", "laundry", "ambient", "activity"),
  defineAsset("music_stand", "樂譜架", "music", "gameplay", "activity"),
  defineAsset("easel", "畫架", "easel", "gameplay", "activity"),
  defineAsset("telescope", "望遠鏡", "telescope", "gameplay", "activity"),
  defineAsset("game_table", "遊戲桌", "game_table", "gameplay", "activity"),
  defineAsset("training_dummy", "訓練木人", "dummy", "gameplay", "activity"),
  defineAsset("relationship_bench", "關係事件長椅", "bench", "gameplay", "activity"),
  defineAsset("gift_table", "送禮桌", "gift_table", "gameplay", "activity"),
  defineAsset("child_play_set", "兒童遊具", "play_set", "gameplay", "activity"),
  defineAsset("vendor_counter", "商販櫃台", "counter", "gameplay", "activity"),
]);

export const VILLAGE_ASSET_DEFINITIONS = Object.freeze([
  ...VILLAGE_ASSET_DEFINITIONS_BUILDINGS,
  ...VILLAGE_ASSET_DEFINITIONS_MODULAR,
  ...VILLAGE_ASSET_DEFINITIONS_MARKETWORKSHOP,
  ...VILLAGE_ASSET_DEFINITIONS_RESIDENTIALLEARNING,
  ...VILLAGE_ASSET_DEFINITIONS_CIVIC,
  ...VILLAGE_ASSET_DEFINITIONS_EXTERIOR,
  ...VILLAGE_ASSET_DEFINITIONS_ACTIVITY,
]);

export const VILLAGE_ASSET_DEFINITIONS_BY_ID = Object.freeze(Object.fromEntries(VILLAGE_ASSET_DEFINITIONS.map((asset) => [asset.id, asset])));
export const VILLAGE_ASSET_DEFINITIONS_COUNT = VILLAGE_ASSET_DEFINITIONS.length;
