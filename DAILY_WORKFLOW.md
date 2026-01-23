# 📋 CODZIENNY WORKFLOW - Jak nie stracić postępu pracy

## 🚀 NA POCZĄTKU SESJI (gdy włączasz PC)

### 1. Sprawdź gdzie skończyłeś
```bash
# Otwórz i przeczytaj:
cat CURRENT_WORK.md

# Sprawdź git status
git status

# Zobacz ostatnie commity
git log --oneline -5
```

### 2. Sprawdź co się zmieniło
```bash
# Zobacz niezatwierdzone zmiany
git diff

# Zobacz co jest staged
git diff --staged
```

### 3. Zaplanuj co dziś robisz
- Otwórz `CURRENT_WORK.md`
- Zaktualizuj sekcję "TERAZ ROBIĘ"
- Dodaj notatki z poprzedniej sesji jeśli zapomniałeś

---

## 💻 W TRAKCIE PRACY

### Commituj CZĘSTO (co 30-60 minut lub po każdym feature)

```bash
# Gdy coś działa:
git add .
git commit -m "✨ Opis co zrobiłeś"
git push

# Przykłady dobrych commitów:
# ✨ Add welcome ETH API endpoint
# 🐛 Fix relay wallet balance check
# 🔧 Update Privy config for production
# 📚 Document welcome ETH flow
```

### Emoji w commitach (opcjonalne ale fajne):
- ✨ `:sparkles:` - Nowy feature
- 🐛 `:bug:` - Bug fix
- 🔧 `:wrench:` - Config change
- 📚 `:books:` - Dokumentacja
- 🚀 `:rocket:` - Deploy / Performance
- ♻️ `:recycle:` - Refactor
- 🎨 `:art:` - UI/UX changes

---

## 🌙 NA KONIEC SESJI (PRZED ZAMKNIĘCIEM TERMINALA!)

### ⚠️ TO JEST NAJWAŻNIEJSZE! ⚠️

**Nigdy nie zamykaj terminala bez wykonania tych kroków:**

### 1. Zapisz stan pracy (2 minuty)

```bash
# Otwórz CURRENT_WORK.md i zaktualizuj:
# - Co zrobiłeś dzisiaj
# - Co TERAZ robisz (jeśli w środku feature)
# - Jakie problemy napotkałeś
# - Co jest następne do zrobienia
```

Przykład:
```markdown
## 📝 NOTATKI Z OSTATNIEJ SESJI:

### 2026-01-23 (17:30)
- Zaimplementowałem auto welcome ETH
- Działa, ale czasem fail jeśli relay wallet ma 0 balance
- PROBLEM: Trzeba dodać auto-refill relay wallet
- NEXT: Zrobić webhook od Stripe do auto-refill
- Files changed: /api/sync-wallet/route.ts, lib/wallet/relay.ts
```

### 2. Commituj wszystko (nawet jeśli nie działa!)

```bash
# Jeśli feature DZIAŁA:
git add .
git commit -m "✨ Feature description - COMPLETE"
git push

# Jeśli feature NIE DZIAŁA (work in progress):
git add .
git commit -m "🚧 WIP: Feature description - still debugging X"
git push

# Nawet jeśli kod jest broken - commituj!
# Dodaj w message "WIP" (Work In Progress)
```

### 3. Zapisz wszystkie ważne informacje

Otwórz `CURRENT_WORK.md` i dodaj:
- Linki które otwierałeś (docs, dashboardy)
- Error messages które dostałeś
- Pomysły co zrobić następnym razem
- Numery portów jeśli coś lokalnie hostowałeś

### 4. Zaktualizuj CHANGELOG (jeśli coś istotnego zrobiłeś)

```bash
# Otwórz CHANGELOG.md i dodaj:
## 2026-01-23 - Tytuł tego co zrobiłeś

### ✨ Dodane
- Welcome ETH auto-send system
```

### 5. Sprawdź czy wszystko jest zapisane

```bash
# Wszystko committed?
git status
# Powinno pokazać: "nothing to commit, working tree clean"

# Wszystko pushed?
git log origin/main..HEAD
# Powinno być puste (wszystkie commity są na remote)

# Push jeśli coś zostało:
git push
```

---

## 🔥 SZYBKI CHECKLIST (wydrukuj i przyklej przy monitorze!)

```
PRZED ZAMKNIĘCIEM TERMINALA:

☐ Zaktualizowałem CURRENT_WORK.md (co teraz robię, problemy, next steps)
☐ git add .
☐ git commit -m "description"
☐ git push
☐ Sprawdziłem: git status (should be clean)
☐ Dodałem notatki w CURRENT_WORK.md (błędy, linki, pomysły)
☐ (Opcjonalnie) Zaktualizowałem CHANGELOG.md jeśli duży feature
```

**⏱️ To zajmie 3-5 minut, ale URATUJE godziny pracy!**

---

## 🆘 CO ZROBIĆ GDY ZAPOMNIAŁEM I JUŻ ZRESETOWAŁEM PC?

### Nie panikuj! Git pamięta wszystko co było committed:

```bash
# Zobacz wszystkie zmiany z ostatnich 7 dni
git log --since="7 days ago" --oneline

# Zobacz co zmieniłeś w ostatnim commit
git show HEAD

# Zobacz zmiany z przedostatniego commita
git show HEAD~1

# Zobacz wszystkie pliki zmienione w ostatnich 3 commitach
git diff HEAD~3 HEAD --name-only

# Zobacz pełny diff ostatnich zmian
git diff HEAD~5 HEAD
```

### Odtwórz kontekst:
1. Czytaj `git log --oneline -20` - commit messages pokażą co robiłeś
2. Czytaj `CHANGELOG.md` - historia feature'ów
3. Czytaj `CURRENT_WORK.md` - jeśli zaktualizowałeś przed zamknięciem

---

## 📊 BONUS: GitHub Issues (opcjonalne)

Jeśli używasz GitHub, możesz trackować większe taski:

```bash
# Utwórz issue na GitHubie dla każdego feature:
# - "Implement welcome ETH system"
# - "Add auto treasury creation"
# - "Fix relay wallet refill"

# W commit message linkuj do issue:
git commit -m "✨ Add welcome ETH endpoint (fixes #12)"
```

---

## 🎯 ZASADA ZŁOTA:

> **COMMIT EARLY, COMMIT OFTEN**
>
> Lepiej 10 małych commitów niż 1 duży po 8 godzinach pracy.
>
> Nawet jeśli kod nie działa - commituj z "WIP" w message.
> Git to twoja sieć bezpieczeństwa!

---

## 🤔 FAQ

**Q: Co jeśli nie skończyłem feature a muszę zamknąć PC?**
A: Commituj jako WIP (Work In Progress):
```bash
git commit -m "🚧 WIP: Welcome ETH - debugging balance check issue"
```

**Q: Czy mogę commitować broken code?**
A: TAK! Lepiej broken code w git niż stracić 3 godziny pracy.

**Q: Jak często powinienem pushować?**
A: Po każdym commit. `git push` to backup w chmurze.

**Q: Co jeśli zapomniałem hasła do git?**
A: Ustaw credential helper:
```bash
git config --global credential.helper store
# Potem przy pierwszym push wpisz raz hasło i zapamięta
```

**Q: Czy "serenity" to jakieś narzędzie?**
A: Nie wiem o jakim "serenity" mówiłeś, ale ten workflow + git to wszystko czego potrzebujesz! 😊

---

**Powodzenia! Już nigdy nie stracisz pracy!** 🚀
