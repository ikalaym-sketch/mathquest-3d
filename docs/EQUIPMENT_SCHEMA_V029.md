# v0.29｜裝備實例、穿戴欄與3D掛載契約

## 1. 三個不同層級

1. **Definition**：裝備種類固定資料。
2. **Instance**：玩家實際持有的單件裝備，具有唯一`instanceId`。
3. **Equipped Loadout**：穿戴欄只保存`instanceId`。

同款兩把武器不再共享等級或詞綴。

## 2. 正式戰鬥穿戴欄

- `head`
- `body`
- `hands`
- `legs`
- `feet`
- `mainHand`
- `offHand`
- `accessory`

## 3. 外觀覆蓋欄

- `faceAccessory`
- `hairAccessory`
- `back`
- `waist`
- `aura`
- `costumeOverride`

外觀覆蓋不直接修改戰鬥能力。

## 4. 獨立系統

- 守護夥伴：`companionState.activeId`
- 農具：`activeTool`
- `equipped.pet`不再是正式欄位。

## 5. Equipment Instance

每件裝備至少保存：

- `instanceId`
- `definitionId`
- `level`
- `experience`
- `quality`
- `affixes`
- `enhancement`
- `locked`
- `acquiredAt`

## 6. 舊存檔遷移

Save Schema升級到6：

- `weapon`轉為`mainHand`。
- `pet`轉入`companionState`後移除。
- `equipmentLevels[itemId]`轉入各裝備Instance。
- `weaponAffixes[itemId]`轉入各裝備Instance。
- 重複同款裝備保留為多個不同Instance。

## 7. 3D掛載

v0.29建立掛載Resolver與主／副手、頭、背、飾品基礎層。現有角色GLB的Socket仍有限，因此手、腿、鞋等完整分件顯示列入v0.31角色重製，不得誤報已全部可視化。

## 8. 動畫規則

裝備Definition提供：

- `archetype`
- `handedness`
- `animationSet`
- `visualAssetId`
- `supportsOffHand`
- Socket及掛載修正

戰鬥、動畫、命中區與UI必須讀取同一Definition，禁止各自判斷。
