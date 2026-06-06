/*
 Navicat Premium Dump SQL

 Source Server         : xzxymysql
 Source Server Type    : MySQL
 Source Server Version : 80044 (8.0.44)
 Source Host           : localhost:3306
 Source Schema         : qa_collector

 Target Server Type    : MySQL
 Target Server Version : 80044 (8.0.44)
 File Encoding         : 65001

 Date: 04/06/2026 15:53:28
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin_users
-- ----------------------------
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_3fgxk4ewgaxgtgvqwb1jjudj6`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admin_users
-- ----------------------------
INSERT INTO `admin_users` VALUES (1, '2026-06-04 06:03:23.740229', '$2a$10$hDLS.ASzj0A.6CB.VwUbbO1CxM954QZ3mgUpnX3Tb7YGNzyBxI0ym', 'admin', 'admin');

-- ----------------------------
-- Table structure for age_groups
-- ----------------------------
DROP TABLE IF EXISTS `age_groups`;
CREATE TABLE `age_groups`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `max_age` int NOT NULL,
  `min_age` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10, 2) NOT NULL,
  `sort_order` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of age_groups
-- ----------------------------
INSERT INTO `age_groups` VALUES (1, '2026-06-04 06:03:23.662984', 12, 3, 'Children (3-12)', 19.00, 1);
INSERT INTO `age_groups` VALUES (2, '2026-06-04 06:03:23.662984', 17, 13, 'Teenagers (13-17)', 19.00, 2);
INSERT INTO `age_groups` VALUES (3, '2026-06-04 06:03:23.662984', 25, 18, 'Young Adults (18-25)', 19.00, 3);
INSERT INTO `age_groups` VALUES (4, '2026-06-04 06:03:23.662984', 40, 26, 'Adults (26-40)', 19.00, 4);
INSERT INTO `age_groups` VALUES (5, '2026-06-04 06:03:23.662984', 60, 41, 'Middle-aged (41-60)', 19.00, 5);
INSERT INTO `age_groups` VALUES (6, '2026-06-04 06:03:23.662984', 120, 60, 'Seniors (60+)', 19.00, 6);

-- ----------------------------
-- Table structure for answers
-- ----------------------------
DROP TABLE IF EXISTS `answers`;
CREATE TABLE `answers`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `question_id` bigint NOT NULL,
  `respondent_age` int NOT NULL,
  `selected_option` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of answers
-- ----------------------------
INSERT INTO `answers` VALUES (1, NULL, 2, 12, 'B');
INSERT INTO `answers` VALUES (2, NULL, 1, 12, 'C');
INSERT INTO `answers` VALUES (3, NULL, 4, 25, 'B');
INSERT INTO `answers` VALUES (4, NULL, 4, 25, 'B');
INSERT INTO `answers` VALUES (5, NULL, 4, 25, 'B');
INSERT INTO `answers` VALUES (6, NULL, 4, 25, 'B');
INSERT INTO `answers` VALUES (7, NULL, 9, 11, 'A');
INSERT INTO `answers` VALUES (8, NULL, 2, 11, 'C');
INSERT INTO `answers` VALUES (9, NULL, 11, 11, 'C');
INSERT INTO `answers` VALUES (10, NULL, 10, 11, 'A');
INSERT INTO `answers` VALUES (11, NULL, 13, 11, 'C');

-- ----------------------------
-- Table structure for app_settings
-- ----------------------------
DROP TABLE IF EXISTS `app_settings`;
CREATE TABLE `app_settings`  (
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `public_visible` bit(1) NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (`setting_key`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of app_settings
-- ----------------------------
INSERT INTO `app_settings` VALUES ('payment_mode', 'Payment mode: mock or live', b'0', 'mock', '2026-06-04 06:53:41.623601');
INSERT INTO `app_settings` VALUES ('quiz_question_count', 'Number of quiz questions shown to users', b'1', '5', '2026-06-04 06:53:41.612637');

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age_group_id` bigint NULL DEFAULT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `completed_at` datetime(6) NULL DEFAULT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_frontend_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `partner_order_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `question_id` bigint NULL DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK_fyt30ud6qu6cg7djvyuet1u3g`(`trade_no` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------
INSERT INTO `payments` VALUES (1, 3, 19.00, '2026-06-04 07:32:30.394414', '2026-06-04 07:32:30.378469', 'USD', 'http://39.97.224.240:8842/#/?orderId=BP1780558354283F5DF04', 'BP1780558354283F5DF04', 4, 'completed', 'pay_1780558350377_ad42e10b');
INSERT INTO `payments` VALUES (2, 1, 19.00, NULL, '2026-06-04 07:52:26.209574', 'USD', NULL, NULL, 9, 'pending', 'pay_1780559546207_eeb2c05f');
INSERT INTO `payments` VALUES (3, 1, 19.00, NULL, '2026-06-04 07:52:27.685511', 'USD', NULL, NULL, 9, 'pending', 'pay_1780559547685_fa55f511');

-- ----------------------------
-- Table structure for question_options
-- ----------------------------
DROP TABLE IF EXISTS `question_options`;
CREATE TABLE `question_options`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `option_key` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK4ehy3qxa0h878lfx0dsmiu7rk`(`question_id` ASC, `option_key` ASC) USING BTREE,
  CONSTRAINT `FKsb9v00wdrgc9qojtjkv7e1gkp` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 51 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of question_options
-- ----------------------------
INSERT INTO `question_options` VALUES (1, 'A', 'Red / 红色', 1);
INSERT INTO `question_options` VALUES (2, 'B', 'Blue / 蓝色', 1);
INSERT INTO `question_options` VALUES (3, 'C', 'Green / 绿色', 1);
INSERT INTO `question_options` VALUES (4, 'D', 'Yellow / 黄色', 1);
INSERT INTO `question_options` VALUES (5, 'A', 'Doctor / 医生', 2);
INSERT INTO `question_options` VALUES (6, 'B', 'Teacher / 老师', 2);
INSERT INTO `question_options` VALUES (7, 'C', 'Astronaut / 宇航员', 2);
INSERT INTO `question_options` VALUES (8, 'D', 'Artist / 艺术家', 2);
INSERT INTO `question_options` VALUES (9, 'A', 'Study alone / 独自学习', 3);
INSERT INTO `question_options` VALUES (10, 'B', 'Study group / 小组学习', 3);
INSERT INTO `question_options` VALUES (11, 'C', 'Online courses / 在线课程', 3);
INSERT INTO `question_options` VALUES (12, 'D', 'Tutor / 家教辅导', 3);
INSERT INTO `question_options` VALUES (13, 'A', 'Get promoted / 获得晋升', 4);
INSERT INTO `question_options` VALUES (14, 'B', 'Start a business / 创业', 4);
INSERT INTO `question_options` VALUES (15, 'C', 'Switch careers / 转行', 4);
INSERT INTO `question_options` VALUES (16, 'D', 'Work abroad / 海外工作', 4);
INSERT INTO `question_options` VALUES (17, 'A', 'Strict schedule / 严格时间表', 5);
INSERT INTO `question_options` VALUES (18, 'B', 'Flexible hours / 弹性时间', 5);
INSERT INTO `question_options` VALUES (19, 'C', 'Remote work / 远程办公', 5);
INSERT INTO `question_options` VALUES (20, 'D', 'Family first / 家庭优先', 5);
INSERT INTO `question_options` VALUES (21, 'A', 'Health / 健康', 6);
INSERT INTO `question_options` VALUES (22, 'B', 'Wealth / 财富', 6);
INSERT INTO `question_options` VALUES (23, 'C', 'Family / 家庭', 6);
INSERT INTO `question_options` VALUES (24, 'D', 'Legacy / 传承', 6);
INSERT INTO `question_options` VALUES (25, 'A', 'Walking / 散步', 7);
INSERT INTO `question_options` VALUES (26, 'B', 'Gardening / 园艺', 7);
INSERT INTO `question_options` VALUES (27, 'C', 'Reading / 阅读', 7);
INSERT INTO `question_options` VALUES (28, 'D', 'Social clubs / 社交活动', 7);
INSERT INTO `question_options` VALUES (29, 'A', 'A1', 8);
INSERT INTO `question_options` VALUES (30, 'B', 'B1', 8);
INSERT INTO `question_options` VALUES (31, 'A', 'w', 9);
INSERT INTO `question_options` VALUES (32, 'B', 'a', 9);
INSERT INTO `question_options` VALUES (33, 'C', 'v', 9);
INSERT INTO `question_options` VALUES (34, 'D', 'b', 9);
INSERT INTO `question_options` VALUES (35, 'A', 'a', 10);
INSERT INTO `question_options` VALUES (36, 'B', 'v', 10);
INSERT INTO `question_options` VALUES (37, 'C', 'x', 10);
INSERT INTO `question_options` VALUES (38, 'D', 'tg', 10);
INSERT INTO `question_options` VALUES (39, 'A', 'n', 11);
INSERT INTO `question_options` VALUES (40, 'B', 'v', 11);
INSERT INTO `question_options` VALUES (41, 'C', 'a', 11);
INSERT INTO `question_options` VALUES (42, 'D', 'x', 11);
INSERT INTO `question_options` VALUES (43, 'A', 'm', 12);
INSERT INTO `question_options` VALUES (44, 'B', 'm,', 12);
INSERT INTO `question_options` VALUES (45, 'C', 'm,m', 12);
INSERT INTO `question_options` VALUES (46, 'D', 'mm', 12);
INSERT INTO `question_options` VALUES (47, 'A', 'ggg', 13);
INSERT INTO `question_options` VALUES (48, 'B', 'bvvv', 13);
INSERT INTO `question_options` VALUES (49, 'C', 'vsa', 13);
INSERT INTO `question_options` VALUES (50, 'D', 'wtr', 13);

-- ----------------------------
-- Table structure for question_translations
-- ----------------------------
DROP TABLE IF EXISTS `question_translations`;
CREATE TABLE `question_translations`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `language_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_id` bigint NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UK4739mj33j5whgj2rga5r0meqi`(`question_id` ASC, `language_code` ASC) USING BTREE,
  CONSTRAINT `FK651x0wbgyay2p2ofiaa8mlfcj` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 42 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of question_translations
-- ----------------------------
INSERT INTO `question_translations` VALUES (1, 'Pick the color you like most!', 'en', 1, 'What\'s your favorite color?');
INSERT INTO `question_translations` VALUES (2, '选择你最喜欢的颜色！', 'zh', 1, '你最喜欢什么颜色？');
INSERT INTO `question_translations` VALUES (3, '¡Elige el color que más te guste!', 'es', 1, '¿Cuál es tu color favorito?');
INSERT INTO `question_translations` VALUES (4, 'Choisis la couleur que tu préfères !', 'fr', 1, 'Quelle est ta couleur préférée ?');
INSERT INTO `question_translations` VALUES (5, '一番好きな色を選んでください！', 'ja', 1, '好きな色は何ですか？');
INSERT INTO `question_translations` VALUES (6, 'Choose your dream job!', 'en', 2, 'What do you want to be when you grow up?');
INSERT INTO `question_translations` VALUES (7, '选择你梦想的职业！', 'zh', 2, '长大后想做什么？');
INSERT INTO `question_translations` VALUES (8, '¡Elige tu trabajo soñado!', 'es', 2, '¿Qué quieres ser de mayor?');
INSERT INTO `question_translations` VALUES (9, 'Choisis ton métier de rêve !', 'fr', 2, 'Que veux-tu faire plus tard ?');
INSERT INTO `question_translations` VALUES (10, '夢の職業を選んでください！', 'ja', 2, '大きくなったら何になりたいですか？');
INSERT INTO `question_translations` VALUES (11, 'Choose your study style', 'en', 3, 'How do you prefer to study?');
INSERT INTO `question_translations` VALUES (12, '选择你的学习方式', 'zh', 3, '你喜欢怎样学习？');
INSERT INTO `question_translations` VALUES (13, 'Elige tu estilo de estudio', 'es', 3, '¿Cómo prefieres estudiar?');
INSERT INTO `question_translations` VALUES (14, 'Choisis ton style d\'étude', 'fr', 3, 'Comment préfères-tu étudier ?');
INSERT INTO `question_translations` VALUES (15, 'あなたの学習スタイルを選んでください', 'ja', 3, 'どのように勉強するのが好きですか？');
INSERT INTO `question_translations` VALUES (16, 'Pick your top priority', 'en', 4, 'What\'s your biggest career goal right now?');
INSERT INTO `question_translations` VALUES (17, '选择你的首要目标', 'zh', 4, '你目前最大的职业目标是什么？');
INSERT INTO `question_translations` VALUES (18, 'Elige tu prioridad principal', 'es', 4, '¿Cuál es tu mayor objetivo profesional ahora?');
INSERT INTO `question_translations` VALUES (19, 'Choisissez votre priorité', 'fr', 4, 'Quel est votre plus grand objectif de carrière actuellement ?');
INSERT INTO `question_translations` VALUES (20, '最優先事項を選んでください', 'ja', 4, '今の最大のキャリア目標は何ですか？');
INSERT INTO `question_translations` VALUES (21, 'Choose your approach', 'en', 5, 'How do you balance work and family?');
INSERT INTO `question_translations` VALUES (22, '选择你的方式', 'zh', 5, '你如何平衡工作与家庭？');
INSERT INTO `question_translations` VALUES (23, 'Elige tu enfoque', 'es', 5, '¿Cómo equilibras trabajo y familia?');
INSERT INTO `question_translations` VALUES (24, 'Choisissez votre approche', 'fr', 5, 'Comment équilibrez-vous travail et famille ?');
INSERT INTO `question_translations` VALUES (25, 'あなたのアプローチを選んでください', 'ja', 5, '仕事と家族のバランスはどう取っていますか？');
INSERT INTO `question_translations` VALUES (26, 'Choose your priority', 'en', 6, 'What matters most to you now?');
INSERT INTO `question_translations` VALUES (27, '选择你的优先事项', 'zh', 6, '现在什么对你最重要？');
INSERT INTO `question_translations` VALUES (28, 'Elige tu prioridad', 'es', 6, '¿Qué es más importante para ti ahora?');
INSERT INTO `question_translations` VALUES (29, 'Choisissez votre priorité', 'fr', 6, 'Qu\'est-ce qui compte le plus pour vous maintenant ?');
INSERT INTO `question_translations` VALUES (30, '優先事項を選んでください', 'ja', 6, '今あなたにとって最も重要なことは何ですか？');
INSERT INTO `question_translations` VALUES (31, 'Pick your favorite activity', 'en', 7, 'How do you stay active?');
INSERT INTO `question_translations` VALUES (32, '选择你最喜欢的活动', 'zh', 7, '你如何保持活力？');
INSERT INTO `question_translations` VALUES (33, 'Elige tu actividad favorita', 'es', 7, '¿Cómo te mantienes activo?');
INSERT INTO `question_translations` VALUES (34, 'Choisissez votre activité préférée', 'fr', 7, 'Comment restez-vous actif ?');
INSERT INTO `question_translations` VALUES (35, 'お気に入りのアクティビティを選んでください', 'ja', 7, 'どうやって活動的に過ごしていますか？');
INSERT INTO `question_translations` VALUES (36, 'desc', 'zh', 8, 'test');
INSERT INTO `question_translations` VALUES (37, '', 'en', 9, 'nisise');
INSERT INTO `question_translations` VALUES (38, '', 'en', 10, 'ssss');
INSERT INTO `question_translations` VALUES (39, '', 'en', 11, 'ttt');
INSERT INTO `question_translations` VALUES (40, '', 'en', 12, 's');
INSERT INTO `question_translations` VALUES (41, '', 'en', 13, 'sad');

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `age_group_id` bigint NOT NULL,
  `created_at` datetime(6) NULL DEFAULT NULL,
  `is_active` bit(1) NULL DEFAULT NULL,
  `updated_at` datetime(6) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK23bsyo9otufe14x7790h6eaxf`(`age_group_id` ASC) USING BTREE,
  CONSTRAINT `FK23bsyo9otufe14x7790h6eaxf` FOREIGN KEY (`age_group_id`) REFERENCES `age_groups` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of questions
-- ----------------------------
INSERT INTO `questions` VALUES (1, 1, '2026-06-04 06:03:23.744216', b'1', NULL);
INSERT INTO `questions` VALUES (2, 1, '2026-06-04 06:03:23.751192', b'1', NULL);
INSERT INTO `questions` VALUES (3, 2, '2026-06-04 06:03:23.756176', b'1', NULL);
INSERT INTO `questions` VALUES (4, 3, '2026-06-04 06:03:23.761159', b'1', NULL);
INSERT INTO `questions` VALUES (5, 4, '2026-06-04 06:03:23.765146', b'1', NULL);
INSERT INTO `questions` VALUES (6, 5, '2026-06-04 06:03:23.769132', b'1', NULL);
INSERT INTO `questions` VALUES (7, 6, '2026-06-04 06:03:23.774116', b'1', NULL);
INSERT INTO `questions` VALUES (8, 2, NULL, b'1', NULL);
INSERT INTO `questions` VALUES (9, 1, NULL, b'1', NULL);
INSERT INTO `questions` VALUES (10, 1, NULL, b'1', NULL);
INSERT INTO `questions` VALUES (11, 1, NULL, b'1', NULL);
INSERT INTO `questions` VALUES (12, 1, NULL, b'1', NULL);
INSERT INTO `questions` VALUES (13, 1, NULL, b'1', NULL);

SET FOREIGN_KEY_CHECKS = 1;
