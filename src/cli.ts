#!/usr/bin/env node

import * as path from 'path';
import { validateRecipesInDirectory, loadRecipesFromDirectory } from './loader/recipeLoader';

const RECIPES_DIR = process.env.RECIPES_DIR || path.join(process.cwd(), 'recipes');

/**
 * ヘルプメッセージを表示
 */
function showHelp(): void {
  console.log(`
Automation Recipes CLI

Usage:
  recipes <command> [options]

Commands:
  validate [dir]    Validate all recipe YAML files in the directory
                    Default directory: ./recipes

  list [dir]        List all recipes in the directory

  show <id> [dir]   Show details of a specific recipe

  help              Show this help message

Environment Variables:
  RECIPES_DIR       Default directory for recipes (default: ./recipes)

Examples:
  recipes validate
  recipes validate ./my-recipes
  recipes list
  recipes show slack-notify-001
`);
}

/**
 * validateコマンド
 */
async function validateCommand(args: string[]): Promise<void> {
  const dir = args[0] || RECIPES_DIR;

  console.log(`Validating recipes in: ${dir}\n`);

  const result = await validateRecipesInDirectory(dir);

  console.log(`Total files: ${result.totalFiles}`);
  console.log(`Valid recipes: ${result.validRecipes}`);
  console.log(`Errors: ${result.errors.length}\n`);

  if (result.errors.length > 0) {
    console.log('Validation errors:');
    result.errors.forEach((err, index) => {
      console.log(`\n${index + 1}. ${path.basename(err.filePath)}`);
      console.log(`   Error: ${err.error}`);
      if (err.field) {
        console.log(`   Field: ${err.field}`);
      }
    });
    process.exit(1);
  } else {
    console.log('✓ All recipes are valid!');
    process.exit(0);
  }
}

/**
 * listコマンド
 */
async function listCommand(args: string[]): Promise<void> {
  const dir = args[0] || RECIPES_DIR;

  console.log(`Recipes in: ${dir}\n`);

  try {
    const recipes = await loadRecipesFromDirectory(dir);

    if (recipes.length === 0) {
      console.log('No recipes found.');
      return;
    }

    recipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.name}`);
      console.log(`   ID: ${recipe.id}`);
      console.log(`   Description: ${recipe.description}`);
      console.log(`   Version: ${recipe.version}`);
      if (recipe.metadata?.tags) {
        console.log(`   Tags: ${recipe.metadata.tags.join(', ')}`);
      }
      console.log('');
    });

    console.log(`Total: ${recipes.length} recipe(s)`);
  } catch (error) {
    console.error('Error loading recipes:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * showコマンド
 */
async function showCommand(args: string[]): Promise<void> {
  const recipeId = args[0];
  const dir = args[1] || RECIPES_DIR;

  if (!recipeId) {
    console.error('Error: Recipe ID is required');
    console.log('Usage: recipes show <id> [dir]');
    process.exit(1);
  }

  try {
    const recipes = await loadRecipesFromDirectory(dir);
    const recipe = recipes.find(r => r.id === recipeId);

    if (!recipe) {
      console.error(`Recipe not found: ${recipeId}`);
      process.exit(1);
    }

    console.log('Recipe Details:\n');
    console.log(JSON.stringify(recipe, null, 2));
  } catch (error) {
    console.error('Error loading recipe:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  const commandArgs = args.slice(1);

  switch (command) {
    case 'validate':
      await validateCommand(commandArgs);
      break;

    case 'list':
      await listCommand(commandArgs);
      break;

    case 'show':
      await showCommand(commandArgs);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "recipes help" for usage information.');
      process.exit(1);
  }
}

// 実行
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
