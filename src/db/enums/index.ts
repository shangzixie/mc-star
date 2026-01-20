/**
 * Centralized enums that are persisted in the database as *string codes*.
 *
 * Why:
 * - Avoid Postgres `ENUM` types (schema changes for new values are painful)
 * - Keep a single source of truth for allowed codes across DB + API validation + UI
 *
 * Notes:
 * - The database stores the *code* (e.g. 'SEA_FCL'); UI can map to i18n labels.
 * - Validation is enforced at the application layer (e.g. Zod `z.enum(...)`).
 */

// -----------------------------------------------------------------------------
// Freight / Warehouse / Transport nodes
// -----------------------------------------------------------------------------

export const LOCATION_TYPES = ['SEA', 'AIR', 'RAIL', 'ROAD'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const TRANSPORT_MODES = ['SEA', 'AIR', 'RAIL'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const SHIPMENT_STATUSES = [
  'DRAFT',
  'BOOKED',
  'SHIPPED',
  'ARRIVED',
  'CLOSED',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const RECEIPT_STATUSES = ['RECEIVED', 'SHIPPED', 'PARTIAL'] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const WAREHOUSE_RECEIPT_TRANSPORT_TYPES = [
  // 运输类型（存储英文枚举码；UI 通过 i18n 显示中文）
  // SEA_FCL: 海运整柜
  // AIR_FREIGHT: 航空货运
  // SEA_LCL: 海运拼箱
  // DOMESTIC_TRANSPORT: 内贸运输
  // WAREHOUSING: 仓储服务
  // ROAD_FTL: 陆路运输（整车）
  // ROAD_LTL: 陆路运输（拼车）
  // EXPRESS_LINEHAUL: 快递/专线
  // FBA_SEA: FBA海运
  // FBA_AIR: FBA空运
  // FBA_RAIL: FBA铁路
  // BULK_CARGO: 散杂货船
  // RAIL_FREIGHT: 铁路运输
  'SEA_FCL',
  'AIR_FREIGHT',
  'SEA_LCL',
  // 'DOMESTIC_TRANSPORT',
  // 'WAREHOUSING',
  // 'ROAD_FTL',
  // 'ROAD_LTL',
  // 'EXPRESS_LINEHAUL',
  // 'FBA_SEA',
  // 'FBA_AIR',
  // 'FBA_RAIL',
  // 'BULK_CARGO',
  // 'RAIL_FREIGHT',
] as const;
export type WarehouseReceiptTransportType =
  (typeof WAREHOUSE_RECEIPT_TRANSPORT_TYPES)[number];

export const WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES = [
  // 报关类型（存储英文枚举码；UI 通过 i18n 显示中文）
  // NO_DECLARATION: 不报关
  // BUY_ORDER: 买单
  // FORMAL_DECLARATION: 正报
  'NO_DECLARATION',
  'BUY_ORDER',
  'FORMAL_DECLARATION',
] as const;
export type WarehouseReceiptCustomsDeclarationType =
  (typeof WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES)[number];

export const ALLOCATION_STATUSES = [
  'ALLOCATED',
  'PICKED',
  'LOADED',
  'SHIPPED',
  'CANCELLED',
] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const RESERVED_ALLOCATION_STATUSES = [
  'ALLOCATED',
  'PICKED',
  'LOADED',
] as const;
export type ReservedAllocationStatus =
  (typeof RESERVED_ALLOCATION_STATUSES)[number];

export const MOVEMENT_REF_TYPES = [
  'RECEIPT',
  'ALLOCATION',
  'PICK',
  'LOAD',
  'SHIP',
  'ADJUST',
] as const;
export type MovementRefType = (typeof MOVEMENT_REF_TYPES)[number];

export const PACKAGING_UNITS = [
  'CTNS',
  'PCS',
  'BALES',
  'BAGS',
  'WOODEN BOX',
  'WOODEN PALLET',
  'PLASTIC PALLET',
  'METAL PALLET',
  'OTHER',
] as const;
export type PackagingUnit = (typeof PACKAGING_UNITS)[number];

// -----------------------------------------------------------------------------
// Carrier options (airlines/ocean carriers)
// -----------------------------------------------------------------------------

export interface CarrierOption {
  name: string;
  code: string | null;
}

export const AIRLINE_OPTIONS: CarrierOption[] = [
  {
    "name": "(NORTHWEST AIRLINES) DELTA AIR LINES",
    "code": "NW"
  },
  {
    "name": "ABSA CARGO AIRLINE",
    "code": "M3"
  },
  {
    "name": "ADRIA AIRWAYS",
    "code": "JP"
  },
  {
    "name": "AEGEAN AIRLINES",
    "code": "A3"
  },
  {
    "name": "AER LINGUS CARGO",
    "code": "EI"
  },
  {
    "name": "AEROFLOT",
    "code": "SU"
  },
  {
    "name": "AEROFLOT",
    "code": "SU"
  },
  {
    "name": "AEROLINEAS ARGENTINAS",
    "code": "AR"
  },
  {
    "name": "AEROMEXICO CARGO",
    "code": "AM"
  },
  {
    "name": "AEROSVIT",
    "code": "VV"
  },
  {
    "name": "AEROUNION",
    "code": "6R"
  },
  {
    "name": "AIR ALGERIE",
    "code": "AH"
  },
  {
    "name": "AIR ARABIA",
    "code": "G9"
  },
  {
    "name": "AIR ARMENIA",
    "code": "QN"
  },
  {
    "name": "AIR ASTANA",
    "code": "KC"
  },
  {
    "name": "AIR ATLANTA ICELANDIC",
    "code": "CC"
  },
  {
    "name": "AIR BALTIC",
    "code": "BT"
  },
  {
    "name": "AIR BERLIN",
    "code": "AB"
  },
  {
    "name": "AIR CANADA",
    "code": "AC"
  },
  {
    "name": "AIR CHINA",
    "code": "CA"
  },
  {
    "name": "AIR EUROPA CARGO",
    "code": "UX"
  },
  {
    "name": "AIR FRANCE",
    "code": "AF"
  },
  {
    "name": "AIR GREENLAND",
    "code": "GL"
  },
  {
    "name": "AIR HONG KONG",
    "code": "LD"
  },
  {
    "name": "AIR INDIA",
    "code": "AI"
  },
  {
    "name": "AIR JAMAICA",
    "code": "JM"
  },
  {
    "name": "AIR MACAU",
    "code": "NX"
  },
  {
    "name": "AIR MADAGASCAR",
    "code": "MD"
  },
  {
    "name": "AIR MALAWI",
    "code": "QM"
  },
  {
    "name": "AIR MALTA",
    "code": "KM"
  },
  {
    "name": "AIR MAURITIUS",
    "code": "MK"
  },
  {
    "name": "AIR MOLDOVA",
    "code": "9U"
  },
  {
    "name": "AIR NEW ZEALAND",
    "code": "NZ"
  },
  {
    "name": "AIR NIUGINI",
    "code": "PX"
  },
  {
    "name": "AIR SERBIA (JAT)",
    "code": "JU"
  },
  {
    "name": "AIR SEYCHELLES",
    "code": "HM"
  },
  {
    "name": "AIR TAHITI NUI",
    "code": "TN"
  },
  {
    "name": "AIR TRANSAT",
    "code": "TS"
  },
  {
    "name": "AIRASIA",
    "code": "D7"
  },
  {
    "name": "AIRASIA BERHAD",
    "code": "AK"
  },
  {
    "name": "AIRBRIDGE CARGO",
    "code": "RU"
  },
  {
    "name": "AIRMAX CARGO",
    "code": "X8"
  },
  {
    "name": "ALASKA AIRLINES",
    "code": "AS"
  },
  {
    "name": "ALITALIA",
    "code": "AZ"
  },
  {
    "name": "ALLIED AIR",
    "code": "4W"
  },
  {
    "name": "ALOHA AIR CARGO",
    "code": "KH"
  },
  {
    "name": "AMERICAN AIRLINES",
    "code": "AA"
  },
  {
    "name": "AMERIJET INTERNATIONAL",
    "code": "M6"
  },
  {
    "name": "ANA ALL NIPPON CARGO",
    "code": "NH"
  },
  {
    "name": "ARIK AIR",
    "code": "W3"
  },
  {
    "name": "ASIANA AIRLINES",
    "code": "OZ"
  },
  {
    "name": "ASTRAL AVIATION",
    "code": "8V"
  },
  {
    "name": "ATLANTIC SOUTHEAST AIRLINES",
    "code": "EV"
  },
  {
    "name": "ATLAS AIR",
    "code": "5Y"
  },
  {
    "name": "AV CARGO",
    "code": "Z3"
  },
  {
    "name": "AVIANCA CARGO",
    "code": "AV"
  },
  {
    "name": "AZERBAIJAN AIRLINES",
    "code": "J2"
  },
  {
    "name": "AZUL CARGO",
    "code": "AD"
  },
  {
    "name": "BAHAMASAIR",
    "code": "UP"
  },
  {
    "name": "BANGKOK AIRWAYS",
    "code": "PG"
  },
  {
    "name": "BIMAN BANGLADESH",
    "code": "BG"
  },
  {
    "name": "BRINGER AIR CARGO",
    "code": "E6"
  },
  {
    "name": "BRITISH AIRWAYS",
    "code": "BA"
  },
  {
    "name": "BRUSSELS AIRLINES",
    "code": "SN"
  },
  {
    "name": "BULGARIA AIR",
    "code": "FB"
  },
  {
    "name": "CAL CARGO AIR LINES",
    "code": "5C"
  },
  {
    "name": "CAMAIR-CO",
    "code": "QC"
  },
  {
    "name": "CANADIAN AIRLINES INT´L",
    "code": "CP"
  },
  {
    "name": "CARGOJET AIRWAYS",
    "code": "W8"
  },
  {
    "name": "CARGOLUX AIRLINES",
    "code": "CV"
  },
  {
    "name": "CARGOLUX ITALIA",
    "code": "C8"
  },
  {
    "name": "CARIBBEAN AIRLINES",
    "code": "BW"
  },
  {
    "name": "CATHAY PACIFIC AIRWAYS",
    "code": "CX"
  },
  {
    "name": "CAYMAN AIRWAYS",
    "code": "KX"
  },
  {
    "name": "CENTURION AIR CARGO",
    "code": "WE"
  },
  {
    "name": "CHINA AIRLINES",
    "code": "CI"
  },
  {
    "name": "CHINA CARGO AIRLINES",
    "code": "CK"
  },
  {
    "name": "CHINA EASTERN AIRLINES",
    "code": "MU"
  },
  {
    "name": "CHINA SOUTHERN AIRLINES",
    "code": "CZ"
  },
  {
    "name": "COMAIR",
    "code": "OH"
  },
  {
    "name": "CONTINENTAL AIRLINES",
    "code": "CO"
  },
  {
    "name": "COPA AIRLINES CARGO",
    "code": "CM"
  },
  {
    "name": "CORSAIR",
    "code": "SS"
  },
  {
    "name": "COYNE AIRWAYS",
    "code": "7C"
  },
  {
    "name": "CROATIA AIRLINES",
    "code": "OU"
  },
  {
    "name": "CUBANA DE AVIACION",
    "code": "CU"
  },
  {
    "name": "CYPRUS AIRWAYS",
    "code": "CY"
  },
  {
    "name": "CZECH AIRLINES",
    "code": "OK"
  },
  {
    "name": "DELTA AIR LINES",
    "code": "DL"
  },
  {
    "name": "DHL AERO EXPRESO",
    "code": "D5"
  },
  {
    "name": "DHL AVIATION / EUROPEAN AIR TRANSPORT",
    "code": "QY"
  },
  {
    "name": "DHL AVIATION/DHL AIRWAYS",
    "code": "ER"
  },
  {
    "name": "DRAGONAIR",
    "code": "KA"
  },
  {
    "name": "EGYPTAIR",
    "code": "MS"
  },
  {
    "name": "EL AL",
    "code": "LY"
  },
  {
    "name": "EMIRATES",
    "code": "EK"
  },
  {
    "name": "ESTAFETA CARGA AEREA",
    "code": "E7"
  },
  {
    "name": "ESTONIAN AIR",
    "code": "OV"
  },
  {
    "name": "ETHIOPIAN AIRLINES",
    "code": "ET"
  },
  {
    "name": "ETIHAD AIRWAYS",
    "code": "EY"
  },
  {
    "name": "EVA AIRWAYS",
    "code": "BR"
  },
  {
    "name": "FAR EASTERN AIR TRANSPORT",
    "code": "EF"
  },
  {
    "name": "FEDEX",
    "code": "FX"
  },
  {
    "name": "FINNAIR",
    "code": "AY"
  },
  {
    "name": "FLYDUBAI CARGO",
    "code": "FZ"
  },
  {
    "name": "GABON AIRLINES",
    "code": "GY"
  },
  {
    "name": "GARUDA INDONESIA",
    "code": "GA"
  },
  {
    "name": "GLOBAL AVIATION AND SERVICES",
    "code": "5S"
  },
  {
    "name": "GOL AIRLINES (VRG LINHAS AÉREAS)",
    "code": "G3"
  },
  {
    "name": "GULF AIR",
    "code": "GF"
  },
  {
    "name": "HAINAN AIRLINES",
    "code": "HU"
  },
  {
    "name": "HAWAIIAN AIRLINES",
    "code": "HA"
  },
  {
    "name": "HONG KONG AIRLINES",
    "code": "N8"
  },
  {
    "name": "HONG KONG express",
    "code": "UO"
  },
  {
    "name": "IBERIA",
    "code": "IB"
  },
  {
    "name": "ICELANDAIR",
    "code": "FI"
  },
  {
    "name": "INDIGO CARGO",
    "code": "6E"
  },
  {
    "name": "INSEL AIR CARGO",
    "code": "7I"
  },
  {
    "name": "IRAN AIR",
    "code": "IR"
  },
  {
    "name": "JAPAN AIR SYSTEM",
    "code": "JD"
  },
  {
    "name": "JAPAN AIRLINES",
    "code": "JL"
  },
  {
    "name": "JET AIRWAYS",
    "code": "9W"
  },
  {
    "name": "JET AIRWAYS INC. (US)",
    "code": "QJ"
  },
  {
    "name": "JET CLUB",
    "code": "0J"
  },
  {
    "name": "JETAIRFLY",
    "code": "TB"
  },
  {
    "name": "JETBLUE AIRWAYS",
    "code": "B6"
  },
  {
    "name": "JUBBA AIRWAYS",
    "code": "3J"
  },
  {
    "name": "KALITTA AIR",
    "code": "K4"
  },
  {
    "name": "KENYA AIRWAYS",
    "code": "KQ"
  },
  {
    "name": "KLM CARGO",
    "code": "KL"
  },
  {
    "name": "KOREAN AIR",
    "code": "KE"
  },
  {
    "name": "KUWAIT AIRWAYS",
    "code": "KU"
  },
  {
    "name": "LACSA AIRLINES OF COSTA RICA",
    "code": "LR"
  },
  {
    "name": "LAN AIRLINES (LATAM)",
    "code": "LA"
  },
  {
    "name": "LAN CHILE CARGO",
    "code": "UC"
  },
  {
    "name": "LAUDA AIR",
    "code": "NG"
  },
  {
    "name": "LEADERJET",
    "code": "1A"
  },
  {
    "name": "LIAT AIRLINES",
    "code": "LI"
  },
  {
    "name": "LOT POLISH AIRLINES",
    "code": "LO"
  },
  {
    "name": "LTU (LEISURE CARGO)",
    "code": "AB"
  },
  {
    "name": "LUFTHANSA CARGO AG",
    "code": "LH"
  },
  {
    "name": "MALAYSIAN AIRLINE SYSTEM",
    "code": "MH"
  },
  {
    "name": "MANDARIN AIRLINES",
    "code": "AE"
  },
  {
    "name": "MARTINAIR CARGO",
    "code": "MP"
  },
  {
    "name": "MASAIR",
    "code": "MY"
  },
  {
    "name": "MIDDLE EAST AIRLINES",
    "code": "ME"
  },
  {
    "name": "MNG AIRLINES",
    "code": "MB"
  },
  {
    "name": "MOVIE REVIEWS",
    "code": "MR"
  },
  {
    "name": "NATIONAL AIR CARGO",
    "code": "N8"
  },
  {
    "name": "NIPPON CARGO AIRLINES",
    "code": "KZ"
  },
  {
    "name": "NORTHERN AIR CARGO",
    "code": "NC"
  },
  {
    "name": "NORWEGIAN CARGO",
    "code": "DY"
  },
  {
    "name": "OLYMPIC AIRWAYS",
    "code": "OA"
  },
  {
    "name": "OMAN AIR",
    "code": "WY"
  },
  {
    "name": "PAKISTAN INT´L AIRLINES",
    "code": "PK"
  },
  {
    "name": "PEGASUS CARGO",
    "code": "PC"
  },
  {
    "name": "PHILIPPINE AIRLINES",
    "code": "PR"
  },
  {
    "name": "POLAR AIR CARGO",
    "code": "PO"
  },
  {
    "name": "QANTAS AIRWAYS",
    "code": "QF"
  },
  {
    "name": "QATAR AIRWAYS",
    "code": "QR"
  },
  {
    "name": "ROYAL AIR MAROC",
    "code": "AT"
  },
  {
    "name": "ROYAL BRUNEI AIRLINES",
    "code": "BI"
  },
  {
    "name": "ROYAL JORDANIAN",
    "code": "RJ"
  },
  {
    "name": "RUS (RELIABLE UNIQUE SERVICES) AVIATION",
    "code": "R4"
  },
  {
    "name": "SAC SOUTH AMERICAN AIRWAYS",
    "code": "S6"
  },
  {
    "name": "SAS-SCANDINAVIAN AIRLINES SYSTEM",
    "code": "SK"
  },
  {
    "name": "SATA AIR ACORES",
    "code": "SP"
  },
  {
    "name": "SATA INTERNATIONAL",
    "code": "S4"
  },
  {
    "name": "SAUDI ARABIAN AIRLINES",
    "code": "SV"
  },
  {
    "name": "SHANDONG AIRLINES",
    "code": "SC"
  },
  {
    "name": "SHANGHAI AIRLINES",
    "code": "FM"
  },
  {
    "name": "SHENZHEN AIRLINES",
    "code": "ZH"
  },
  {
    "name": "SIBERIA AIRLINES",
    "code": "S7"
  },
  {
    "name": "SICHUAN AIRLINES",
    "code": "3U"
  },
  {
    "name": "SILK AIR",
    "code": "MI"
  },
  {
    "name": "SILK WAY AIRLINES",
    "code": "ZP"
  },
  {
    "name": "SILK WAY WEST AIRLINES",
    "code": "7L"
  },
  {
    "name": "SINGAPORE AIRLINES",
    "code": "SQ"
  },
  {
    "name": "SKY WEST AIRLINES",
    "code": "OO"
  },
  {
    "name": "SKYGREECE AIRLINES",
    "code": "GW"
  },
  {
    "name": "SKYLEASE CARGO",
    "code": "KY"
  },
  {
    "name": "SOLAR CARGO",
    "code": "4S"
  },
  {
    "name": "SOUTH AFRICAN AIRWAYS",
    "code": "SA"
  },
  {
    "name": "SOUTHWEST AIRLINES",
    "code": "WN"
  },
  {
    "name": "SPICEJET",
    "code": "SG"
  },
  {
    "name": "SRILANKAN CARGO",
    "code": "UL"
  },
  {
    "name": "STARLIGHT AIRLINES",
    "code": "QP"
  },
  {
    "name": "SWISS",
    "code": "LX"
  },
  {
    "name": "SYRIAN ARAB AIRLINES",
    "code": "RB"
  },
  {
    "name": "TAAG-ANGOLA AIRLINES",
    "code": "DT"
  },
  {
    "name": "TAB TRANSPORTES AEREOS BOLIVIANOS",
    "code": "B1"
  },
  {
    "name": "TACA",
    "code": "TA"
  },
  {
    "name": "TAM BRAZILIAN AIRLINES",
    "code": "JJ"
  },
  {
    "name": "TAMPA AIRLINES",
    "code": "QT"
  },
  {
    "name": "TAP AIR PORTUGAL",
    "code": "TP"
  },
  {
    "name": "TAROM",
    "code": "RO"
  },
  {
    "name": "THAI AIRWAYS",
    "code": "TG"
  },
  {
    "name": "THOMSON AIRWAYS",
    "code": "AB"
  },
  {
    "name": "TMA TRANS MEDITERRANEAN AIRWAYS",
    "code": "T2"
  },
  {
    "name": "TMA TRANS MEDITERRANEAN AIRWAYS",
    "code": "N2"
  },
  {
    "name": "TNT AIRWAYS",
    "code": "3V"
  },
  {
    "name": "TRANS AMERICAN AIRWAYS/TACA PERU",
    "code": "T0"
  },
  {
    "name": "TRANS MEDITERRANEAN AIRWAYS",
    "code": "TL"
  },
  {
    "name": "TUNISAIR",
    "code": "TU"
  },
  {
    "name": "TURKISH AIRLINES",
    "code": "TK"
  },
  {
    "name": "UKRAINE INT´L AIRLINES",
    "code": "PS"
  },
  {
    "name": "UNI AIRWAYS",
    "code": "B7"
  },
  {
    "name": "UNITED AIRLINES CARGO",
    "code": "UA"
  },
  {
    "name": "UPS AIR CARGO",
    "code": "5X"
  },
  {
    "name": "URAL AIRLINES CARGO",
    "code": "U6"
  },
  {
    "name": "USAIRWAYS",
    "code": "US"
  },
  {
    "name": "VARIG",
    "code": "RG"
  },
  {
    "name": "VENSECAR INTERNACIONAL",
    "code": "V4"
  },
  {
    "name": "VIETNAM AIRLINES",
    "code": "VN"
  },
  {
    "name": "VIRGIN ATLANTIC",
    "code": "VS"
  },
  {
    "name": "WESTJET CARGO",
    "code": "WS"
  },
  {
    "name": "XIAMENAIR",
    "code": "MF"
  },
  {
    "name": "YANGTZE RIVER EXPRESS AIRLINES",
    "code": "Y8"
  },
  {
    "name": "YEMENIA YEMEN AIRWAYS",
    "code": "IY"
  }
];

export const OCEAN_CARRIER_OPTIONS: CarrierOption[] = [
  {
    "name": "ANL",
    "code": "ANLC"
  },
  {
    "name": "APL",
    "code": "APLU"
  },
  {
    "name": "CCNI",
    "code": "CCNI"
  },
  {
    "name": "CMA-CGM",
    "code": "CMDU"
  },
  {
    "name": "CNC",
    "code": "CNIU"
  },
  {
    "name": "COSCO",
    "code": "COSU"
  },
  {
    "name": "CSAV",
    "code": null
  },
  {
    "name": "DELMAS",
    "code": null
  },
  {
    "name": "EMIRATES",
    "code": null
  },
  {
    "name": "EVERGREEN",
    "code": "EGLV"
  },
  {
    "name": "FESCO",
    "code": null
  },
  {
    "name": "GOLD-STAR",
    "code": null
  },
  {
    "name": "HAMBURG-SUD",
    "code": null
  },
  {
    "name": "HANJIN",
    "code": "HJSC"
  },
  {
    "name": "HAPAG-LLOYD",
    "code": "HLCU"
  },
  {
    "name": "HEUNG-A",
    "code": null
  },
  {
    "name": "HMM",
    "code": "HDMU"
  },
  {
    "name": "HUBLINE",
    "code": null
  },
  {
    "name": "K-LINE",
    "code": "KKLU"
  },
  {
    "name": "KMTC",
    "code": null
  },
  {
    "name": "MAERSK",
    "code": "MAEU"
  },
  {
    "name": "MOL",
    "code": "MOLU"
  },
  {
    "name": "MSC",
    "code": "MSCU"
  },
  {
    "name": "NAMSUNG",
    "code": null
  },
  {
    "name": "NWA",
    "code": null
  },
  {
    "name": "NYK",
    "code": "NYKS"
  },
  {
    "name": "OOCL",
    "code": "OOLU"
  },
  {
    "name": "PANOCEAN",
    "code": null
  },
  {
    "name": "PIL",
    "code": "PABV"
  },
  {
    "name": "RCL",
    "code": null
  },
  {
    "name": "SAFMARINE",
    "code": "SAFM"
  },
  {
    "name": "SINOKOR",
    "code": null
  },
  {
    "name": "SITC",
    "code": null
  },
  {
    "name": "TCC",
    "code": null
  },
  {
    "name": "TS",
    "code": "TLWN"
  },
  {
    "name": "UASC",
    "code": "UASC"
  },
  {
    "name": "WAN-HAI",
    "code": "WHLC"
  },
  {
    "name": "YML",
    "code": "YMLU"
  },
  {
    "name": "ZIM",
    "code": "ZIMU"
  }
];
