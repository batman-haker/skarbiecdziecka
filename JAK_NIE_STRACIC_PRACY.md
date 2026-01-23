# 🛡️ JAK NIE STRACIĆ PRACY - Quick Guide

## 🎯 Problem
Rozmowy z Claude Code znikają po zamknięciu terminala, więc tracisz kontekst co robiłeś.

## ✅ Rozwiązanie
System 3 plików + Git commits

---

## 📁 Pliki do śledzenia postępu

### 1. **CURRENT_WORK.md** ← NAJWAŻNIEJSZY!
- **Czytaj NA POCZĄTKU sesji** - żeby wiedzieć gdzie skończyłeś
- **Aktualizuj NA KOŃCU sesji** - zapisz co robiłeś, problemy, next steps
- Ten plik odpowiada na: "Nad czym TERAZ pracuję?"

### 2. **CHANGELOG.md**
- Historia wszystkich feature'ów i zmian
- Aktualizuj gdy kończysz większy feature
- Ten plik odpowiada na: "Co zostało zrobione w projekcie?"

### 3. **DAILY_WORKFLOW.md**
- Szczegółowy guide całego workflow
- Przeczytaj raz, żeby zrozumieć system
- Wróć do niego jeśli zapomnisz co robić

---

## ⚡ Quick Start - 3 kroki

### 🌅 Na POCZĄTKU sesji:
```bash
# 1. Zobacz gdzie skończyłeś
cat CURRENT_WORK.md

# 2. Sprawdź git
git status
git log --oneline -5
```

### 💻 W TRAKCIE pracy:
```bash
# Commituj CZĘSTO (co 30-60 min)
git add .
git commit -m "✨ Co zrobiłeś"
git push
```

### 🌙 Na KOŃCU sesji (PRZED ZAMKNIĘCIEM!):
```bash
# Uruchom helper script - poprowadzi Cię krok po kroku
npm run end-session
```

**Alternatywnie ręcznie:**
```bash
# 1. Commit wszystkiego
git add .
git commit -m "🚧 WIP: Opis gdzie skończyłeś"
git push

# 2. Zaktualizuj CURRENT_WORK.md
# - Co dzisiaj zrobiłeś
# - Problemy które napotkałeś
# - Co dalej robić
```

---

## 🔥 GOLDEN RULE

> **NIGDY nie zamykaj terminala bez:**
> 1. `git commit` + `git push`
> 2. Aktualizacji `CURRENT_WORK.md`
>
> **To zajmie 2 minuty, a uratuje godziny pracy!**

---

## 🆘 Co jeśli zapomniałem?

Git pamięta wszystko co było committed:

```bash
# Zobacz co robiłeś ostatnio
git log --oneline -20

# Zobacz zmiany z ostatnich commitów
git show HEAD
git diff HEAD~5 HEAD
```

Jeśli NIE commitowałeś - **stracone** 😢
Dlatego commituj często!

---

## 📋 Checklist (wydrukuj i przyklej!)

```
☐ git add .
☐ git commit -m "description"
☐ git push
☐ Zaktualizować CURRENT_WORK.md
☐ (Opcjonalnie) CHANGELOG.md jeśli duży feature
```

---

## 🎁 Bonus: Helper Script

Zamiast pamiętać wszystko, uruchom:

```bash
npm run end-session
```

Ten script:
- ✅ Sprawdzi git status
- ✅ Pomoże zacommitować zmiany
- ✅ Przypomni o aktualizacji CURRENT_WORK.md
- ✅ Pozwoli zapisać szybkie notatki

---

## 💡 Pro Tips

1. **Commituj nawet broken code** - oznacz jako `🚧 WIP:` w message
2. **Push po każdym commit** - to backup w chmurze
3. **Używaj emoji w commitach** - łatwiej czytać historię
   - ✨ nowy feature
   - 🐛 bug fix
   - 🔧 config change
   - 📚 dokumentacja
4. **Czytaj CURRENT_WORK.md każdego dnia** - zaoszczędzi 30min zastanawiania się "co ja robię?"

---

## 📚 Więcej info

- **DAILY_WORKFLOW.md** - pełny szczegółowy guide
- **CHANGELOG.md** - historia projektu
- **CURRENT_WORK.md** - aktualny stan pracy

---

**Powodzenia! 🚀**

*Ps. Nie wiem co to "serenity" o którym pytałeś, ale ten system działa lepiej niż jakiekolwiek narzędzie! Git + dokumentacja = nie stracisz pracy!*
