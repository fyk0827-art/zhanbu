package com.qacollector.service;

import com.qacollector.dto.*;
import com.qacollector.entity.*;
import com.qacollector.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionTranslationRepository translationRepository;
    private final QuestionOptionRepository optionRepository;
    private final AgeGroupRepository ageGroupRepository;
    private final AnswerRepository answerRepository;

    public List<QuestionDTO> getRandomQuestions(Long ageGroupId, String language, int limit) {
        List<Question> questions = questionRepository.findRandomByAgeGroupId(ageGroupId, limit);
        List<QuestionDTO> result = new ArrayList<>();

        for (Question q : questions) {
            QuestionDTO dto = new QuestionDTO();
            dto.setId(q.getId());
            dto.setAgeGroupId(q.getAgeGroupId());

            // Get translation - try requested language, fallback to localized defaults, then English
            Optional<QuestionTranslation> trans = translationRepository
                .findByQuestionIdAndLanguageCode(q.getId(), language);
            boolean usedEnglishFallback = false;
            if (trans.isEmpty() && !"en".equals(language)) {
                trans = translationRepository.findByQuestionIdAndLanguageCode(q.getId(), "en");
                usedEnglishFallback = trans.isPresent();
            }
            String title = trans.map(QuestionTranslation::getTitle).orElse("Question #" + q.getId());
            String description = trans.map(QuestionTranslation::getDescription).orElse("");
            if (usedEnglishFallback) {
                LocalizedQuestion localized = localizeQuestion(title, language);
                title = localized.title();
                description = localized.description();
            }
            dto.setTitle(title);
            dto.setDescription(description);
            dto.setIsActive(q.getIsActive());

            // Get age group
            AgeGroup ag = ageGroupRepository.findById(q.getAgeGroupId()).orElse(null);
            if (ag != null) {
                AgeGroupDTO agDto = new AgeGroupDTO();
                agDto.setId(ag.getId());
                agDto.setName(ag.getName());
                agDto.setMinAge(ag.getMinAge());
                agDto.setMaxAge(ag.getMaxAge());
                agDto.setPrice(ag.getPrice());
                dto.setAgeGroup(agDto);
            }

            // Get options
            List<QuestionOption> opts = optionRepository.findByQuestionIdOrderByOptionKeyAsc(q.getId());
            List<OptionDTO> optDtos = new ArrayList<>();
            for (QuestionOption o : opts) {
                OptionDTO od = new OptionDTO();
                od.setKey(o.getOptionKey());
                od.setText(localizeOption(o.getOptionText(), language));
                optDtos.add(od);
            }
            dto.setOptions(optDtos);

            result.add(dto);
        }
        return result;
    }

    public List<AdminQuestionDTO> getAllQuestionsAdmin() {
        List<Question> questions = questionRepository.findAll();
        List<AdminQuestionDTO> result = new ArrayList<>();

        for (Question q : questions) {
            AdminQuestionDTO dto = new AdminQuestionDTO();
            dto.setId(q.getId());
            dto.setAgeGroupId(q.getAgeGroupId());
            dto.setIsActive(q.getIsActive());

            AgeGroup ag = ageGroupRepository.findById(q.getAgeGroupId()).orElse(null);
            dto.setAgeGroupName(ag != null ? ag.getName() : "Unknown");

            // Translations
            List<QuestionTranslation> transList = translationRepository.findByQuestionId(q.getId());
            List<TranslationDTO> tDtos = new ArrayList<>();
            for (QuestionTranslation t : transList) {
                TranslationDTO td = new TranslationDTO();
                td.setLanguageCode(t.getLanguageCode());
                td.setTitle(t.getTitle());
                td.setDescription(t.getDescription());
                tDtos.add(td);
            }
            dto.setTranslations(tDtos);

            // Options
            List<QuestionOption> opts = optionRepository.findByQuestionIdOrderByOptionKeyAsc(q.getId());
            List<OptionDTO> oDtos = new ArrayList<>();
            for (QuestionOption o : opts) {
                OptionDTO od = new OptionDTO();
                od.setKey(o.getOptionKey());
                od.setText(o.getOptionText());
                oDtos.add(od);
            }
            dto.setOptions(oDtos);

            result.add(dto);
        }
        return result;
    }

    @Transactional
    public Long createQuestion(CreateQuestionRequest req) {
        Question q = new Question();
        q.setAgeGroupId(req.getAgeGroupId());
        q.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        q = questionRepository.save(q);

        // Save translations
        for (TranslationDTO t : req.getTranslations()) {
            QuestionTranslation qt = new QuestionTranslation();
            qt.setQuestionId(q.getId());
            qt.setLanguageCode(t.getLanguageCode());
            qt.setTitle(t.getTitle());
            qt.setDescription(t.getDescription());
            translationRepository.save(qt);
        }

        // Save options
        for (OptionDTO o : req.getOptions()) {
            QuestionOption qo = new QuestionOption();
            qo.setQuestionId(q.getId());
            qo.setOptionKey(o.getKey());
            qo.setOptionText(o.getText());
            optionRepository.save(qo);
        }

        return q.getId();
    }

    @Transactional
    public void updateQuestion(Long id, CreateQuestionRequest req) {
        Question q = questionRepository.findById(id).orElseThrow();
        if (req.getAgeGroupId() != null) q.setAgeGroupId(req.getAgeGroupId());
        if (req.getIsActive() != null) q.setIsActive(req.getIsActive());
        questionRepository.save(q);

        // Update translations
        if (req.getTranslations() != null && !req.getTranslations().isEmpty()) {
            translationRepository.deleteAll(translationRepository.findByQuestionId(id));
            for (TranslationDTO t : req.getTranslations()) {
                QuestionTranslation qt = new QuestionTranslation();
                qt.setQuestionId(id);
                qt.setLanguageCode(t.getLanguageCode());
                qt.setTitle(t.getTitle());
                qt.setDescription(t.getDescription());
                translationRepository.save(qt);
            }
        }

        // Update options
        if (req.getOptions() != null && !req.getOptions().isEmpty()) {
            optionRepository.deleteAll(optionRepository.findByQuestionIdOrderByOptionKeyAsc(id));
            for (OptionDTO o : req.getOptions()) {
                QuestionOption qo = new QuestionOption();
                qo.setQuestionId(id);
                qo.setOptionKey(o.getKey());
                qo.setOptionText(o.getText());
                optionRepository.save(qo);
            }
        }
    }

    @Transactional
    public void deleteQuestion(Long id) {
        optionRepository.deleteAll(optionRepository.findByQuestionIdOrderByOptionKeyAsc(id));
        translationRepository.deleteAll(translationRepository.findByQuestionId(id));
        questionRepository.deleteById(id);
    }

    @Transactional
    public Long submitAnswer(SubmitAnswerRequest req) {
        Answer a = new Answer();
        a.setQuestionId(req.getQuestionId());
        a.setRespondentAge(req.getRespondentAge());
        a.setSelectedOption(req.getSelectedOption());
        a = answerRepository.save(a);
        return a.getId();
    }

    public PageDTO<AnswerDTO> getAllAnswers(int page, int pageSize) {
        List<Answer> answers = answerRepository.findAllByOrderByCreatedAtDesc(
            PageRequest.of(page - 1, pageSize));
        long total = answerRepository.count();

        List<AnswerDTO> dtos = new ArrayList<>();
        for (Answer a : answers) {
            AnswerDTO dto = new AnswerDTO();
            dto.setId(a.getId());
            dto.setQuestionId(a.getQuestionId());
            dto.setRespondentAge(a.getRespondentAge());
            dto.setSelectedOption(a.getSelectedOption());
            dto.setCreatedAt(a.getCreatedAt());

            // Get question title
            Optional<QuestionTranslation> qt = translationRepository
                .findByQuestionIdAndLanguageCode(a.getQuestionId(), "en");
            dto.setQuestionTitle(qt.map(QuestionTranslation::getTitle)
                .orElse("Question #" + a.getQuestionId()));

            dtos.add(dto);
        }

        PageDTO<AnswerDTO> result = new PageDTO<>();
        result.setItems(dtos);
        result.setTotal(total);
        result.setPage(page);
        result.setPageSize(pageSize);
        return result;
    }

    private static LocalizedQuestion localizeQuestion(String englishTitle, String language) {
        String lang = normalizeLanguage(language);
        Map<String, Map<String, LocalizedQuestion>> data = Map.of(
            "What's your favorite color?", Map.of(
                "de", new LocalizedQuestion("Was ist deine Lieblingsfarbe?", "Wähle die Farbe, die du am meisten magst!"),
                "ko", new LocalizedQuestion("가장 좋아하는 색은 무엇인가요?", "가장 좋아하는 색을 선택하세요!"),
                "pt", new LocalizedQuestion("Qual é a sua cor favorita?", "Escolha a cor que você mais gosta!"),
                "ru", new LocalizedQuestion("Какой ваш любимый цвет?", "Выберите цвет, который вам нравится больше всего!"),
                "ar", new LocalizedQuestion("ما لونك المفضل؟", "اختر اللون الذي تحبه أكثر!")
            ),
            "What do you want to be when you grow up?", Map.of(
                "de", new LocalizedQuestion("Was möchtest du werden, wenn du groß bist?", "Wähle deinen Traumberuf!"),
                "ko", new LocalizedQuestion("커서 무엇이 되고 싶나요?", "꿈의 직업을 선택하세요!"),
                "pt", new LocalizedQuestion("O que você quer ser quando crescer?", "Escolha a profissão dos seus sonhos!"),
                "ru", new LocalizedQuestion("Кем вы хотите стать, когда вырастете?", "Выберите профессию мечты!"),
                "ar", new LocalizedQuestion("ماذا تريد أن تصبح عندما تكبر؟", "اختر وظيفة أحلامك!")
            ),
            "How do you prefer to study?", Map.of(
                "de", new LocalizedQuestion("Wie lernst du am liebsten?", "Wähle deinen Lernstil"),
                "ko", new LocalizedQuestion("어떻게 공부하는 것을 선호하나요?", "공부 방식을 선택하세요"),
                "pt", new LocalizedQuestion("Como você prefere estudar?", "Escolha seu estilo de estudo"),
                "ru", new LocalizedQuestion("Как вам больше нравится учиться?", "Выберите свой стиль обучения"),
                "ar", new LocalizedQuestion("كيف تفضل الدراسة؟", "اختر أسلوب الدراسة الخاص بك")
            ),
            "What's your biggest career goal right now?", Map.of(
                "de", new LocalizedQuestion("Was ist derzeit dein größtes Karriereziel?", "Wähle deine wichtigste Priorität"),
                "ko", new LocalizedQuestion("지금 가장 큰 커리어 목표는 무엇인가요?", "가장 중요한 목표를 선택하세요"),
                "pt", new LocalizedQuestion("Qual é seu maior objetivo de carreira agora?", "Escolha sua principal prioridade"),
                "ru", new LocalizedQuestion("Какая ваша главная карьерная цель сейчас?", "Выберите главный приоритет"),
                "ar", new LocalizedQuestion("ما أكبر هدف مهني لديك الآن؟", "اختر أولويتك الرئيسية")
            ),
            "How do you balance work and family?", Map.of(
                "de", new LocalizedQuestion("Wie bringst du Arbeit und Familie in Einklang?", "Wähle deinen Ansatz"),
                "ko", new LocalizedQuestion("일과 가족의 균형을 어떻게 맞추나요?", "당신의 방식을 선택하세요"),
                "pt", new LocalizedQuestion("Como você equilibra trabalho e família?", "Escolha sua abordagem"),
                "ru", new LocalizedQuestion("Как вы совмещаете работу и семью?", "Выберите свой подход"),
                "ar", new LocalizedQuestion("كيف توازن بين العمل والعائلة؟", "اختر طريقتك")
            ),
            "What matters most to you now?", Map.of(
                "de", new LocalizedQuestion("Was ist dir jetzt am wichtigsten?", "Wähle deine Priorität"),
                "ko", new LocalizedQuestion("지금 당신에게 가장 중요한 것은 무엇인가요?", "우선순위를 선택하세요"),
                "pt", new LocalizedQuestion("O que mais importa para você agora?", "Escolha sua prioridade"),
                "ru", new LocalizedQuestion("Что для вас сейчас важнее всего?", "Выберите приоритет"),
                "ar", new LocalizedQuestion("ما الأهم بالنسبة لك الآن؟", "اختر أولويتك")
            ),
            "How do you stay active?", Map.of(
                "de", new LocalizedQuestion("Wie bleibst du aktiv?", "Wähle deine Lieblingsaktivität"),
                "ko", new LocalizedQuestion("어떻게 활력을 유지하나요?", "좋아하는 활동을 선택하세요"),
                "pt", new LocalizedQuestion("Como você se mantém ativo?", "Escolha sua atividade favorita"),
                "ru", new LocalizedQuestion("Как вы поддерживаете активность?", "Выберите любимое занятие"),
                "ar", new LocalizedQuestion("كيف تحافظ على نشاطك؟", "اختر نشاطك المفضل")
            )
        );
        return data.getOrDefault(englishTitle, Map.of())
            .getOrDefault(lang, new LocalizedQuestion(englishTitle, ""));
    }

    private static String localizeOption(String rawText, String language) {
        String lang = normalizeLanguage(language);
        Map<String, Map<String, String>> data = Map.ofEntries(
            Map.entry("Red / 红色", Map.of("en", "Red", "zh", "红色", "es", "Rojo", "fr", "Rouge", "ja", "赤", "de", "Rot", "ko", "빨강", "pt", "Vermelho", "ru", "Красный", "ar", "أحمر")),
            Map.entry("Blue / 蓝色", Map.of("en", "Blue", "zh", "蓝色", "es", "Azul", "fr", "Bleu", "ja", "青", "de", "Blau", "ko", "파랑", "pt", "Azul", "ru", "Синий", "ar", "أزرق")),
            Map.entry("Green / 绿色", Map.of("en", "Green", "zh", "绿色", "es", "Verde", "fr", "Vert", "ja", "緑", "de", "Grün", "ko", "초록", "pt", "Verde", "ru", "Зеленый", "ar", "أخضر")),
            Map.entry("Yellow / 黄色", Map.of("en", "Yellow", "zh", "黄色", "es", "Amarillo", "fr", "Jaune", "ja", "黄色", "de", "Gelb", "ko", "노랑", "pt", "Amarelo", "ru", "Желтый", "ar", "أصفر")),
            Map.entry("Doctor / 医生", Map.of("en", "Doctor", "zh", "医生", "es", "Médico", "fr", "Médecin", "ja", "医師", "de", "Arzt", "ko", "의사", "pt", "Médico", "ru", "Врач", "ar", "طبيب")),
            Map.entry("Teacher / 老师", Map.of("en", "Teacher", "zh", "老师", "es", "Profesor", "fr", "Enseignant", "ja", "教師", "de", "Lehrer", "ko", "교사", "pt", "Professor", "ru", "Учитель", "ar", "معلم")),
            Map.entry("Astronaut / 宇航员", Map.of("en", "Astronaut", "zh", "宇航员", "es", "Astronauta", "fr", "Astronaute", "ja", "宇宙飛行士", "de", "Astronaut", "ko", "우주비행사", "pt", "Astronauta", "ru", "Космонавт", "ar", "رائد فضاء")),
            Map.entry("Artist / 艺术家", Map.of("en", "Artist", "zh", "艺术家", "es", "Artista", "fr", "Artiste", "ja", "アーティスト", "de", "Künstler", "ko", "예술가", "pt", "Artista", "ru", "Художник", "ar", "فنان")),
            Map.entry("Study alone / 独自学习", Map.of("en", "Study alone", "zh", "独自学习", "es", "Estudiar solo", "fr", "Étudier seul", "ja", "一人で勉強", "de", "Allein lernen", "ko", "혼자 공부", "pt", "Estudar sozinho", "ru", "Учиться одному", "ar", "الدراسة وحدي")),
            Map.entry("Study group / 小组学习", Map.of("en", "Study group", "zh", "小组学习", "es", "Grupo de estudio", "fr", "Groupe d'étude", "ja", "グループ学習", "de", "Lerngruppe", "ko", "그룹 공부", "pt", "Grupo de estudo", "ru", "Учебная группа", "ar", "مجموعة دراسة")),
            Map.entry("Online courses / 在线课程", Map.of("en", "Online courses", "zh", "在线课程", "es", "Cursos en línea", "fr", "Cours en ligne", "ja", "オンライン講座", "de", "Online-Kurse", "ko", "온라인 강의", "pt", "Cursos online", "ru", "Онлайн-курсы", "ar", "دورات عبر الإنترنت")),
            Map.entry("Tutor / 家教辅导", Map.of("en", "Tutor", "zh", "家教辅导", "es", "Tutor", "fr", "Tuteur", "ja", "家庭教師", "de", "Nachhilfe", "ko", "과외", "pt", "Tutor", "ru", "Репетитор", "ar", "مدرس خصوصي")),
            Map.entry("Get promoted / 获得晋升", Map.of("en", "Get promoted", "zh", "获得晋升", "es", "Ascender", "fr", "Obtenir une promotion", "ja", "昇進する", "de", "Befördert werden", "ko", "승진하기", "pt", "Ser promovido", "ru", "Получить повышение", "ar", "الحصول على ترقية")),
            Map.entry("Start a business / 创业", Map.of("en", "Start a business", "zh", "创业", "es", "Emprender", "fr", "Créer une entreprise", "ja", "起業する", "de", "Ein Unternehmen gründen", "ko", "창업하기", "pt", "Começar um negócio", "ru", "Начать бизнес", "ar", "بدء مشروع")),
            Map.entry("Switch careers / 转行", Map.of("en", "Switch careers", "zh", "转行", "es", "Cambiar de carrera", "fr", "Changer de carrière", "ja", "転職する", "de", "Karriere wechseln", "ko", "직업 바꾸기", "pt", "Mudar de carreira", "ru", "Сменить карьеру", "ar", "تغيير المسار المهني")),
            Map.entry("Work abroad / 海外工作", Map.of("en", "Work abroad", "zh", "海外工作", "es", "Trabajar en el extranjero", "fr", "Travailler à l'étranger", "ja", "海外で働く", "de", "Im Ausland arbeiten", "ko", "해외 근무", "pt", "Trabalhar no exterior", "ru", "Работать за границей", "ar", "العمل في الخارج")),
            Map.entry("Strict schedule / 严格时间表", Map.of("en", "Strict schedule", "zh", "严格时间表", "es", "Horario estricto", "fr", "Horaire strict", "ja", "厳格な予定", "de", "Strenger Zeitplan", "ko", "엄격한 일정", "pt", "Agenda rígida", "ru", "Строгий график", "ar", "جدول صارم")),
            Map.entry("Flexible hours / 弹性时间", Map.of("en", "Flexible hours", "zh", "弹性时间", "es", "Horario flexible", "fr", "Horaires flexibles", "ja", "柔軟な時間", "de", "Flexible Zeiten", "ko", "유연 근무", "pt", "Horário flexível", "ru", "Гибкий график", "ar", "ساعات مرنة")),
            Map.entry("Remote work / 远程办公", Map.of("en", "Remote work", "zh", "远程办公", "es", "Trabajo remoto", "fr", "Télétravail", "ja", "リモートワーク", "de", "Remote-Arbeit", "ko", "원격 근무", "pt", "Trabalho remoto", "ru", "Удаленная работа", "ar", "عمل عن بعد")),
            Map.entry("Family first / 家庭优先", Map.of("en", "Family first", "zh", "家庭优先", "es", "Familia primero", "fr", "La famille d'abord", "ja", "家族優先", "de", "Familie zuerst", "ko", "가족 우선", "pt", "Família em primeiro lugar", "ru", "Семья прежде всего", "ar", "العائلة أولاً")),
            Map.entry("Health / 健康", Map.of("en", "Health", "zh", "健康", "es", "Salud", "fr", "Santé", "ja", "健康", "de", "Gesundheit", "ko", "건강", "pt", "Saúde", "ru", "Здоровье", "ar", "الصحة")),
            Map.entry("Wealth / 财富", Map.of("en", "Wealth", "zh", "财富", "es", "Riqueza", "fr", "Richesse", "ja", "富", "de", "Wohlstand", "ko", "부", "pt", "Riqueza", "ru", "Богатство", "ar", "الثروة")),
            Map.entry("Family / 家庭", Map.of("en", "Family", "zh", "家庭", "es", "Familia", "fr", "Famille", "ja", "家族", "de", "Familie", "ko", "가족", "pt", "Família", "ru", "Семья", "ar", "العائلة")),
            Map.entry("Legacy / 传承", Map.of("en", "Legacy", "zh", "传承", "es", "Legado", "fr", "Héritage", "ja", "遺産", "de", "Vermächtnis", "ko", "유산", "pt", "Legado", "ru", "Наследие", "ar", "الإرث")),
            Map.entry("Walking / 散步", Map.of("en", "Walking", "zh", "散步", "es", "Caminar", "fr", "Marcher", "ja", "散歩", "de", "Spazierengehen", "ko", "걷기", "pt", "Caminhar", "ru", "Ходьба", "ar", "المشي")),
            Map.entry("Gardening / 园艺", Map.of("en", "Gardening", "zh", "园艺", "es", "Jardinería", "fr", "Jardinage", "ja", "園芸", "de", "Gartenarbeit", "ko", "정원 가꾸기", "pt", "Jardinagem", "ru", "Садоводство", "ar", "البستنة")),
            Map.entry("Reading / 阅读", Map.of("en", "Reading", "zh", "阅读", "es", "Leer", "fr", "Lecture", "ja", "読書", "de", "Lesen", "ko", "독서", "pt", "Leitura", "ru", "Чтение", "ar", "القراءة")),
            Map.entry("Social clubs / 社交活动", Map.of("en", "Social clubs", "zh", "社交活动", "es", "Clubes sociales", "fr", "Clubs sociaux", "ja", "社交クラブ", "de", "Soziale Clubs", "ko", "사교 모임", "pt", "Clubes sociais", "ru", "Клубы общения", "ar", "نواد اجتماعية"))
        );
        if (data.containsKey(rawText)) {
            return data.get(rawText).getOrDefault(lang, data.get(rawText).getOrDefault("en", rawText));
        }
        if ("zh".equals(lang) && rawText.contains("/")) {
            return rawText.substring(rawText.indexOf('/') + 1).trim();
        }
        if (rawText.contains("/")) {
            return rawText.substring(0, rawText.indexOf('/')).trim();
        }
        return rawText;
    }

    private static String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "en";
        }
        return language.split("-")[0].toLowerCase();
    }

    private record LocalizedQuestion(String title, String description) {}
}
