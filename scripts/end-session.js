#!/usr/bin/env node

/**
 * 🌙 END SESSION HELPER
 *
 * Uruchom ten script PRZED zamknięciem terminala!
 * Pomoże Ci nie zapomnieć o zapisaniu postępu pracy.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function ask(question) {
  return new Promise(resolve => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, answer => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.clear();
  log('🌙 END SESSION HELPER', 'bright');
  log('Pomogę Ci zapisać postęp przed zamknięciem terminala!\n', 'cyan');

  try {
    // 1. Check git status
    section('📊 KROK 1: Sprawdzam stan Git');

    const gitStatus = execSync('git status --short').toString();

    if (gitStatus.trim() === '') {
      log('✅ Working tree is clean - wszystko jest zatwierdzone!', 'green');

      // Check if pushed
      try {
        const unpushed = execSync('git log origin/main..HEAD --oneline').toString();
        if (unpushed.trim() !== '') {
          log('⚠️  Masz niezpushowane commity!', 'yellow');
          console.log(unpushed);

          const shouldPush = await ask('Czy chcesz zrobić git push? (y/n)');
          if (shouldPush.toLowerCase() === 'y') {
            log('Pushing...', 'blue');
            execSync('git push', { stdio: 'inherit' });
            log('✅ Pushed!', 'green');
          }
        } else {
          log('✅ Wszystko jest pushed na remote!', 'green');
        }
      } catch (e) {
        // Może nie mieć remote albo być offline - ok
      }
    } else {
      log('⚠️  Masz niezatwierdzone zmiany!', 'yellow');
      console.log(gitStatus);

      const shouldCommit = await ask('\nCzy chcesz zacommitować te zmiany? (y/n)');

      if (shouldCommit.toLowerCase() === 'y') {
        const commitMsg = await ask('Wpisz commit message: ');

        if (commitMsg) {
          log('Committing...', 'blue');
          execSync('git add .', { stdio: 'inherit' });
          execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
          log('✅ Committed!', 'green');

          const shouldPush = await ask('Czy chcesz zrobić git push? (y/n)');
          if (shouldPush.toLowerCase() === 'y') {
            log('Pushing...', 'blue');
            execSync('git push', { stdio: 'inherit' });
            log('✅ Pushed!', 'green');
          }
        }
      } else {
        log('⚠️  UWAGA: Zmiany nie są zatwierdzone! Możesz je stracić.', 'red');
      }
    }

    // 2. Update CURRENT_WORK.md
    section('📝 KROK 2: Aktualizacja CURRENT_WORK.md');

    const currentWorkPath = path.join(__dirname, '..', 'CURRENT_WORK.md');

    log('Otwórz plik CURRENT_WORK.md i zaktualizuj:', 'yellow');
    log('  • Co dzisiaj zrobiłeś', 'yellow');
    log('  • Nad czym teraz pracujesz (jeśli feature nie skończony)', 'yellow');
    log('  • Jakie problemy napotkałeś', 'yellow');
    log('  • Co jest next step', 'yellow');

    const updated = await ask('\nCzy zaktualizowałeś CURRENT_WORK.md? (y/n)');

    if (updated.toLowerCase() === 'y') {
      log('✅ Super!', 'green');
    } else {
      log('⚠️  Pamiętaj, żeby zaktualizować przed wyłączeniem PC!', 'red');
    }

    // 3. Quick notes
    section('💡 KROK 3: Szybkie notatki');

    const hasNotes = await ask('Czy masz jakieś ważne notatki do zapisania? (y/n)');

    if (hasNotes.toLowerCase() === 'y') {
      log('\nWpisz swoje notatki (Enter aby zakończyć każdą linię, pusta linia kończy):', 'cyan');
      const notes = [];

      while (true) {
        const note = await ask('> ');
        if (note === '') break;
        notes.push(note);
      }

      if (notes.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0].substring(0, 5);

        const notesContent = `\n### ${today} (${time})\n${notes.map(n => `- ${n}`).join('\n')}\n`;

        fs.appendFileSync(currentWorkPath, notesContent);
        log('✅ Notatki zapisane w CURRENT_WORK.md!', 'green');
      }
    }

    // 4. Summary
    section('✅ PODSUMOWANIE');

    log('Sprawdź czy zrobiłeś wszystko:', 'bright');
    console.log('');
    log(gitStatus.trim() === '' ? '✅' : '❌', 'green');
    console.log(' Git status clean (wszystko committed)');
    log(updated.toLowerCase() === 'y' ? '✅' : '❌', 'green');
    console.log(' CURRENT_WORK.md zaktualizowany');
    console.log('');

    log('🎉 Gotowe! Możesz bezpiecznie zamknąć terminal.', 'green');
    log('Następnym razem przeczytaj CURRENT_WORK.md żeby wiedzieć gdzie skończyłeś!', 'cyan');

  } catch (error) {
    log(`\n❌ Błąd: ${error.message}`, 'red');
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Przerwano. Pamiętaj zacommitować zmiany przed wyłączeniem PC!');
  process.exit();
});

main();
