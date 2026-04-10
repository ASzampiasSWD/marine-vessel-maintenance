CREATE TABLE marinas(
 marina_id varchar(50) PRIMARY KEY,
 street_name varchar(50) NOT NULL,
 city varchar(50) NOT NULL,
 us_state varchar(2), 
 zip_code varchar(11) NOT NULL,
 country varchar(50) NOT NULL, 
 created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE technicians(
 technician_id varchar(50) PRIMARY KEY,
 marina_id varchar(50) REFERENCES marinas(marina_id) NOT NULL,
 first_name varchar(100) NOT NULL,
 last_name varchar(100) NOT NULL,
 is_active boolean DEFAULT TRUE NOT NULL,
 created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_prices(
 product_price_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 updated_by varchar(100) REFERENCES technicians(technician_id) NOT NULL,
 assigned_to varchar(100) NOT NULL,
 price numeric(10, 2) NOT NULL,
 start_date timestamp DEFAULT CURRENT_TIMESTAMP,
 end_date timestamp DEFAULT NULL,
 referer varchar(200) DEFAULT NULL,
 url_location varchar(200) DEFAULT NULL
);

CREATE TABLE vessel_types(
 vessel_type_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 product_price_id int REFERENCES product_prices(product_price_id),
 vessel_type_name varchar(50) UNIQUE NOT NULL,
 manufacturer varchar(50) NOT NULL,
 created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vessels(
 hull_id_number varchar(12) PRIMARY KEY NOT NULL,
 vessel_type_id int REFERENCES vessel_types(vessel_type_id) NOT NULL,
 warranty_start_date date DEFAULT NULL,
 warranty_end_date date DEFAULT NULL,
 is_active boolean DEFAULT true NOT NULL,
 decommissioned_date date DEFAULT NULL,
 created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vessel_parts(
 vessel_part_id varchar(50) PRIMARY KEY,
 product_price_id int REFERENCES product_prices(product_price_id),
 vessel_part_name varchar(100) NOT NULL, 
 popularity_score int NOT NULL, 
 image_url varchar(200) DEFAULT NULL,
 created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vessel_parts_used_for_vessel_type(
  vessel_part_id varchar(50) REFERENCES vessel_parts(vessel_part_id) NOT NULL,
  vessel_type_id int REFERENCES vessel_types(vessel_type_id) NOT NULL,
  UNIQUE (vessel_part_id, vessel_type_id)
);

CREATE TABLE issues(
 issue_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 issue_description varchar(50) UNIQUE NOT NULL,
 popularity_score int NOT NULL
);

CREATE TABLE repairs(
 repair_id INT PRIMARY KEY,
 hull_id_number varchar(50) REFERENCES vessels(hull_id_number) NOT NULL,
 technician_id varchar(100) REFERENCES technicians(technician_id) NOT NULL,
 dock_location varchar(100) NOT NULL,
 berth_number varchar(50) NULL, 
 time_worked_on integer DEFAULT 15.00 NOT NULL,
 comments varchar(100),
 repair_cost numeric(10, 2) DEFAULT 0.00 NOT NULL,
 money_saved numeric(10, 2) DEFAULT 0.00 NOT NULL, 
 date_time_fixed timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE issues_resolved_on_repair(
 repair_id int REFERENCES repairs(repair_id) NOT NULL,
 issue_id int REFERENCES issues(issue_id) NOT NULL,
 UNIQUE (repair_id, issue_id)
);

CREATE TABLE vessel_parts_used_for_repair(
 repair_id int REFERENCES repairs(repair_id) NOT NULL,
 vessel_part_id varchar(50) REFERENCES vessel_parts(vessel_part_id) NOT NULL,
 UNIQUE (repair_id, vessel_part_id)
);

INSERT INTO marinas VALUES ('Waterside Marina', '333 Waterside Dr.', 'Norfolk', 'VA', '23510', 'USA');
INSERT INTO marinas VALUES ('Belmont Bay Harbor', '570 Harbor Side St', 'Woodbridge', 'VA', '22191', 'USA');
INSERT INTO marinas VALUES ('Burke Lake Park Marina', '7315 Ox Rd', 'Fairfax Station', 'VA', '22039', 'USA');

INSERT INTO technicians VALUES ('aszampias', 'Waterside Marina', 'Amanda', 'Szampias', 't', '2026-01-01 10:10:00.000000+00');
INSERT INTO technicians VALUES ('fbriggs', 'Waterside Marina', 'Finn', 'Briggs', 't', '2026-01-15 10:10:00.000000+00');
INSERT INTO technicians VALUES ('whalyard', 'Belmont Bay Harbor', 'Wade', 'Halyard', 't', '2026-01-20 10:10:00.000000+00');

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '2023 Leopard 46 Powercat', '1339000.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht World', 'images/prices/2023_Leopard_46_Powercat_01-18-2026.png');
INSERT INTO vessel_types VALUES (DEFAULT, 1, '2023 Leopard 46 Powercat', 'Robertson & Caine');

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '2023 Blackfin 302 CC', '289995.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht World', 'images/prices/2023_Blackfin_302_CC_01-18-2026.png');
INSERT INTO vessel_types VALUES (DEFAULT, 2, '2023 Blackfin 302 CC', 'Blackfin Boats');

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '2024 Fleming 58 Pilothouse', '4884205.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht World', 'images/prices/2024_Fleming_58_Pilothouse_01-18-2026.png');
INSERT INTO vessel_types VALUES (DEFAULT, 3, '2024 Fleming 58 Pilothouse', 'Fleming Yachts');

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '2026 Regal 33 SAV', '424998.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht World', 'images/prices/2026_Regal_33_SAV_01-18-2026.png');
INSERT INTO vessel_types VALUES (DEFAULT, 4, '2026 Regal 33 SAV', 'Regal Marine Industries');

INSERT INTO ISSUES VALUES (DEFAULT, 'Broken Parts', 10);
INSERT INTO ISSUES VALUES (DEFAULT, 'Electrical System Failure', 20);
INSERT INTO ISSUES VALUES (DEFAULT, 'Steering & Control Issues', 30);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B1029455-010', '200110.70', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/B1029455-010_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('B1029455-010', 5, 'Haul Replacement', 10); /* Leopard, Blackfin */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B1029455-010', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B1029455-010', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B1046135-080', '50000.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/B1046135-080_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('B1046135-080', 6, 'Steel Roller', 20);  /* Leopard, Blackfin */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B1046135-080', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B1046135-080', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '87167B', '8000.96', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/87167B_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('87167B', 7, 'Boat Belt', 30); /* Leopard, Blackfin*/
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('87167B', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('87167B', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B110580-007', '5000.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/B110580-007_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('B110580-007', 8, 'Sails', 40); /* Lepard, Blackfin */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B110580-007', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B110580-007', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B203020-058', '500.25', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/B203020-058_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('B203020-058', 9, 'Heavy Anchor', 50); /* Leopard */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B203020-058', 1);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '88180B', '1000.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/88180B_01-24-2026.png');
INSERT INTO vessel_parts VALUES ('88180B', 10, 'Steering Wheel', 60); /* Leopard */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('88180B', 1);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B1223730-109', '800.00', '2026-01-01 00:00:00.000000+00', NULL, 'Yacht Repair', 'images/prices/B1223730-109_01-24-2026.png');
INSERT INTO vessel_parts VALUES ('B1223730-109', 11, 'Safety Bar', 70); /* Leopard, Blackfin */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B1223730-109', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B1223730-109', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', '96754', '900.00', '2026-01-01 00:00:00.000000+00', NULL, 'Boat Store', 'images/prices/96754_01-24-2026.png');
INSERT INTO vessel_parts VALUES ('96754', 12, 'Boat Series Screws', 80); /* Leopard, Blackfin */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('96754', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('96754', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B2059040-062', '10000.00', '2026-01-01 00:00:00.000000+00', NULL, 'Boat Store', 'images/prices/B2059040-062_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('B2059040-062', 13, 'Boat Cover', 500); /* Leopard, Blackfin */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B2059040-062', 1);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B2059040-062', 2);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B3332541-251', '15000.27', '2026-01-01 00:00:00.000000+00', NULL, 'MarineTime', 'images/prices/B3332541-251_01-18-2026.png');
INSERT INTO vessel_parts VALUES('B3332541-251', 14, 'Boat Haul', 10);      /* Fleming, Regal */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B3332541-251', 3);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B3332541-251', 4);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'B4442141-261', '5000.90', '2026-01-01 00:00:00.000000+00', NULL, 'Boat Store', 'images/prices/B4442141-261_01-18-2026.png');
INSERT INTO vessel_parts VALUES('B4442141-261', 15, 'Steel Roller', 20); /* Fleming, Regal */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B4442141-261', 3);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('B4442141-261', 4);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'AdjustableSails', '12000.44', '2026-01-01 00:00:00.000000+00', NULL, 'Boat Store', 'images/prices/AdjustableSailss_01-24-2026.png');
INSERT INTO vessel_parts VALUES('AdjustableSails', 16, 'Adjustable Sails', 30); /* Fleming, Regal */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('AdjustableSails', 3);

INSERT INTO product_prices VALUES (DEFAULT, 'aszampias', 'BoatSprings', '900.00', '2026-01-01 00:00:00.000000+00', NULL, 'MarineTime', 'images/prices/BoatSprings_01-18-2026.png');
INSERT INTO vessel_parts VALUES ('BoatSprings', 17, 'Boat Springs', 40); /* Fleming, Regal */
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('BoatSprings', 3);
INSERT INTO vessel_parts_used_for_vessel_type VALUES ('BoatSprings', 4);
