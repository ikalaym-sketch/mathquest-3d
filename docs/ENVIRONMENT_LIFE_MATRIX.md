# Environment & Life Matrix

此文件對應目前 Canonical Runtime；不建立版本後綴資料來源。

| 區域 | 水域行為 | 環境 GLB | 生活 NPC | 動物 | 故事物件 | 室內 | 家具 | 互動 |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| wind_highlands | sky_stream:wade | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| snow_valley | mirror_lake_water:swim<br>frozen_river:ice | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| farm_plains | plains_river:swim<br>orchard_pond:wade | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| star_village | market_river:swim | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| crystal_lake | crystal_main_lake:swim<br>crystal_stream:swim | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| sun_canyon | canyon_oasis:wade<br>ravine_gap:ravine | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| mushroom_grove | glow_pond_water:wade<br>spore_stream:wade | 5 | 3 | 2 | 2 | 4 | 48 | 12 |
| clockwork_ruins | coolant_channel:hazard | 5 | 3 | 2 | 2 | 4 | 48 | 12 |

## Runtime 契約

- 水域：Sensor 為唯一進入判定；淺水／冰面才建立指定地面 Collider。
- 深水：至少兩個可行走上岸候選，具氧氣回復與兒童安全救援。
- NPC：Kinematic RigidBody，晨間、工作、返家、夜間及雨天路線全部經通行服務解析。
- 環境 GLB：每個檔案包含 `LOD0`、`LOD1`、`LOD2`、`COLLIDER_Main`、`SOCKET_Story`。
- 室內：獨立 Pocket Runtime，主地圖怪物、水域及地形 Collider 不會進入室內空間。
