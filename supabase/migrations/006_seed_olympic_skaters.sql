-- Seed skaters from 2026 Milan-Cortina Winter Olympics figure skating entries
-- Pricing based on ISU World Standings per spec section 3.4:
--   #1-5: $12M-$15M, #6-15: $8M-$12M, #16-30: $5M-$8M, #31+: $2M-$5M

-- Clear existing skaters (fresh seed)
DELETE FROM event_entries;
DELETE FROM results;
DELETE FROM user_picks;
DELETE FROM pick_replacements;
DELETE FROM skaters;

-- ==================== MEN'S SINGLES (29 entries) ====================
INSERT INTO skaters (name, country, discipline, world_ranking, current_price, is_active) VALUES
  ('Ilia Malinin',                'USA', 'men', 1,  15000000, true),
  ('Yuma Kagiyama',               'JPN', 'men', 2,  14250000, true),
  ('Mikhail Shaidorov',           'KAZ', 'men', 3,  13500000, true),
  ('Shun Sato',                   'JPN', 'men', 4,  12750000, true),
  ('Adam Siao Him Fa',            'FRA', 'men', 5,  12000000, true),
  ('Kevin Aymoz',                 'FRA', 'men', 6,  11600000, true),
  ('Nika Egadze',                 'GEO', 'men', 7,  11200000, true),
  ('Lukas Britschgi',             'SUI', 'men', 8,  10800000, true),
  ('Daniel Grassl',               'ITA', 'men', 9,  10400000, true),
  ('Kao Miura',                   'JPN', 'men', 10, 10000000, true),
  ('Matteo Rizzo',                'ITA', 'men', 11,  9600000, true),
  ('Junhwan Cha',                 'KOR', 'men', 14,  8400000, true),
  ('Aleksandr Selevko',           'EST', 'men', 15,  8000000, true),
  ('Adam Hagara',                 'SVK', 'men', 19,  7200000, true),
  ('Deniss Vasiljevs',            'LAT', 'men', 20,  7000000, true),
  ('Andrew Torgashev',            'USA', 'men', 21,  6800000, true),
  ('Vladimir Litvintsev',         'AZE', 'men', 23,  6400000, true),
  ('Jin Boyang',                  'CHN', 'men', 24,  6200000, true),
  ('Stephen Gogolev',             'CAN', 'men', 25,  6000000, true),
  ('Vladimir Samoilov',           'POL', 'men', 33,  4700000, true),
  ('Hyungyeom Kim',               'KOR', 'men', 35,  4500000, true),
  ('Fedirs Kuliss',               'LAT', 'men', 39,  4100000, true),
  ('Donovan Carrillo',            'MEX', 'men', 42,  3800000, true),
  ('Maxim Naumov',                'USA', 'men', 45,  3500000, true),
  ('Andreas Nordeback',           'SWE', 'men', 48,  3200000, true),
  ('Tomas-Llorenc Guarino Sabate','ESP', 'men', 50,  3000000, true),
  ('Yu-Hsiang Li',                'TPE', 'men', 55,  2500000, true),
  ('Kyrylo Marsak',               'UKR', 'men', 60,  2000000, true),
  ('Petr Gumennik',               'AIN', 'men', NULL, 10000000, true);

-- ==================== WOMEN'S SINGLES (29 entries) ====================
INSERT INTO skaters (name, country, discipline, world_ranking, current_price, is_active) VALUES
  ('Kaori Sakamoto',     'JPN', 'women', 1,  15000000, true),
  ('Alysa Liu',          'USA', 'women', 2,  14250000, true),
  ('Mone Chiba',         'JPN', 'women', 3,  13500000, true),
  ('Amber Glenn',        'USA', 'women', 4,  12750000, true),
  ('Isabeau Levito',     'USA', 'women', 5,  12000000, true),
  ('Anastasiia Gubanova','GEO', 'women', 7,  11200000, true),
  ('Lara Naki Gutmann',  'ITA', 'women', 9,  10400000, true),
  ('Ami Nakai',          'JPN', 'women', 10, 10000000, true),
  ('Nina Pinzarrone',    'BEL', 'women', 11,  9600000, true),
  ('Niina Petrokina',    'EST', 'women', 12,  9200000, true),
  ('Sofia Samodelkina',  'KAZ', 'women', 17,  7600000, true),
  ('Madeline Schizas',   'CAN', 'women', 18,  7400000, true),
  ('Loena Hendrickx',    'BEL', 'women', 19,  7200000, true),
  ('Lorine Schild',      'FRA', 'women', 20,  7000000, true),
  ('Haein Lee',          'KOR', 'women', 21,  6800000, true),
  ('Jia Shin',           'KOR', 'women', 23,  6400000, true),
  ('Kimmy Repond',       'SUI', 'women', 24,  6200000, true),
  ('Ekaterina Kurakova', 'POL', 'women', 28,  5400000, true),
  ('Iida Karhunen',      'FIN', 'women', 30,  5000000, true),
  ('Julia Sauter',       'ROU', 'women', 35,  4500000, true),
  ('Olga Mikutina',      'AUT', 'women', 37,  4300000, true),
  ('Mariia Seniuk',      'ISR', 'women', 38,  4200000, true),
  ('Livia Kaiser',       'SUI', 'women', 40,  4000000, true),
  ('Ruiyang Zhang',      'CHN', 'women', 45,  3500000, true),
  ('Kristen Spours',     'GBR', 'women', 50,  3000000, true),
  ('Alexandra Feigin',   'BUL', 'women', 48,  3200000, true),
  ('Meda Variakojyte',   'LTU', 'women', 55,  2500000, true),
  ('Adeliia Petrosian',  'AIN', 'women', NULL, 10000000, true),
  ('Viktoriia Safonova', 'AIN', 'women', NULL, 10000000, true);

-- ==================== PAIRS (19 entries) ====================
INSERT INTO skaters (name, country, discipline, world_ranking, current_price, is_active) VALUES
  ('Riku Miura / Ryuichi Kihara',                    'JPN', 'pairs', 1,  15000000, true),
  ('Minerva Fabienne Hase / Nikita Volodin',          'GER', 'pairs', 2,  14250000, true),
  ('Anastasiia Metelkina / Luka Berulava',            'GEO', 'pairs', 3,  13500000, true),
  ('Sara Conti / Niccolo Macii',                      'ITA', 'pairs', 4,  12750000, true),
  ('Deanna Stellato-Dudek / Maxime Deschamps',        'CAN', 'pairs', 5,  12000000, true),
  ('Maria Pavlova / Alexei Sviatchenko',              'HUN', 'pairs', 7,  11200000, true),
  ('Ellie Kam / Danny O''Shea',                       'USA', 'pairs', 8,  10800000, true),
  ('Rebecca Ghilardi / Filippo Ambrosini',            'ITA', 'pairs', 9,  10400000, true),
  ('Lia Pereira / Trennt Michaud',                    'CAN', 'pairs', 10, 10000000, true),
  ('Annika Hocke / Robert Kunkel',                    'GER', 'pairs', 11,  9600000, true),
  ('Emily Chan / Spencer Akira Howe',                 'USA', 'pairs', 12,  9200000, true),
  ('Anastasia Vaipan-Law / Luke Digby',               'GBR', 'pairs', 13,  8800000, true),
  ('Ioulia Chtchetinina / Michal Wozniak',            'POL', 'pairs', 14,  8400000, true),
  ('Yuna Nagaoka / Sumitada Moriguchi',               'JPN', 'pairs', 15,  8000000, true),
  ('Daria Danilova / Michel Tsiba',                   'NED', 'pairs', 17,  7600000, true),
  ('Camille Kovalev / Pavel Kovalev',                 'FRA', 'pairs', 19,  7200000, true),
  ('Anastasiia Golubeva / Hektor Giotopoulos Moore',  'AUS', 'pairs', 25,  6000000, true),
  ('Sui Wenjing / Han Cong',                          'CHN', 'pairs', 29,  5200000, true),
  ('Karina Akopova / Nikita Rakhmanin',               'ARM', 'pairs', 32,  4800000, true);

-- ==================== ICE DANCE (23 entries) ====================
INSERT INTO skaters (name, country, discipline, world_ranking, current_price, is_active) VALUES
  ('Lilah Fear / Lewis Gibson',                         'GBR', 'ice_dance', 1,  15000000, true),
  ('Madison Chock / Evan Bates',                        'USA', 'ice_dance', 2,  14250000, true),
  ('Charlene Guignard / Marco Fabbri',                  'ITA', 'ice_dance', 3,  13500000, true),
  ('Piper Gilles / Paul Poirier',                       'CAN', 'ice_dance', 4,  12750000, true),
  ('Evgeniia Lopareva / Geoffrey Brissaud',             'FRA', 'ice_dance', 5,  12000000, true),
  ('Emilea Zingas / Vadym Kolesnik',                    'USA', 'ice_dance', 6,  11600000, true),
  ('Allison Reed / Saulius Ambrulevicius',              'LTU', 'ice_dance', 7,  11200000, true),
  ('Christina Carreira / Anthony Ponomarenko',          'USA', 'ice_dance', 8,  10800000, true),
  ('Olivia Smart / Tim Dieck',                          'ESP', 'ice_dance', 9,  10400000, true),
  ('Marjorie Lajoie / Zachary Lagha',                   'CAN', 'ice_dance', 11,  9600000, true),
  ('Diana Davis / Gleb Smolkin',                        'GEO', 'ice_dance', 12,  9200000, true),
  ('Juulia Turkkila / Matthias Versluis',               'FIN', 'ice_dance', 13,  8800000, true),
  ('Hannah Lim / Ye Quan',                              'KOR', 'ice_dance', 14,  8400000, true),
  ('Natalie Taschlerova / Filip Taschler',              'CZE', 'ice_dance', 16,  7800000, true),
  ('Katerina Mrazkova / Daniel Mrazek',                 'CZE', 'ice_dance', 18,  7400000, true),
  ('Marie-Jade Lauriault / Romain Le Gac',              'CAN', 'ice_dance', 19,  7200000, true),
  ('Laurence Fournier Beaudry / Guillaume Cizeron',     'FRA', 'ice_dance', 21,  6800000, true),
  ('Jennifer Janse van Rensburg / Benjamin Steffan',    'GER', 'ice_dance', 22,  6600000, true),
  ('Holly Harris / Jason Chan',                          'AUS', 'ice_dance', 26,  5800000, true),
  ('Phebe Bekker / James Hernandez',                     'GBR', 'ice_dance', 32,  4800000, true),
  ('Shiyue Wang / Xinyu Liu',                            'CHN', 'ice_dance', 35,  4500000, true),
  ('Sofia Val / Asaf Kazimov',                           'ESP', 'ice_dance', 38,  4200000, true),
  ('Milla Ruud Reitan / Nikolaj Majorov',                'SWE', 'ice_dance', 42,  3800000, true);
