import * as migration_20260322_233115_initial from './20260322_233115_initial';
import * as migration_20261105_191236_add_projects from './20261105_191236_add_projects';
import * as migration_20261105_200144_add_logo_wall from './20261105_200144_add_logo_wall';
import * as migration_20261105_202957_archive_portfolio_option from './20261105_202957_archive_portfolio_option';
import * as migration_20261105_204014_add_card_grid from './20261105_204014_add_card_grid';
import * as migration_20261105_204643_card_icons_blocks from './20261105_204643_card_icons_blocks';
import * as migration_20261109_101722_archive_project_layout from './20261109_101722_archive_project_layout';

export const migrations = [
  {
    up: migration_20260322_233115_initial.up,
    down: migration_20260322_233115_initial.down,
    name: '20260322_233115_initial',
  },
  {
    up: migration_20261105_191236_add_projects.up,
    down: migration_20261105_191236_add_projects.down,
    name: '20261105_191236_add_projects',
  },
  {
    up: migration_20261105_200144_add_logo_wall.up,
    down: migration_20261105_200144_add_logo_wall.down,
    name: '20261105_200144_add_logo_wall',
  },
  {
    up: migration_20261105_202957_archive_portfolio_option.up,
    down: migration_20261105_202957_archive_portfolio_option.down,
    name: '20261105_202957_archive_portfolio_option',
  },
  {
    up: migration_20261105_204014_add_card_grid.up,
    down: migration_20261105_204014_add_card_grid.down,
    name: '20261105_204014_add_card_grid',
  },
  {
    up: migration_20261105_204643_card_icons_blocks.up,
    down: migration_20261105_204643_card_icons_blocks.down,
    name: '20261105_204643_card_icons_blocks',
  },
  {
    up: migration_20261109_101722_archive_project_layout.up,
    down: migration_20261109_101722_archive_project_layout.down,
    name: '20261109_101722_archive_project_layout'
  },
];
