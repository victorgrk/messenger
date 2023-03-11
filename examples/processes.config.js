'use strict'

const path = require('path')
const defaultLogFile = path.join(__dirname, '/logs/project-server.log')

const folder = process.cwd()
module.exports = {
  'apps': [
    {
      name: "tsed",
      'script': `${folder}/example-tsed/dist/index.js`,
      'cwd': `${folder}/example-tsed`,
      node_args: process.env.NODE_ARGS || "--max_old_space_size=1800",
      exec_mode: "cluster",
      instances: process.env.NODE_ENV === "test" ? 1 : process.env.NB_INSTANCES || 1,
      autorestart: true,
      max_memory_restart: process.env.MAX_MEMORY_RESTART || "750M",
      'out_file': defaultLogFile,
      'error_file': defaultLogFile,
      'merge_logs': true,
      'kill_timeout': 30000,
    },
    {
      name: "typedi",
      'script': `${folder}/typedi-example/dist/index.js`,
      'cwd': `${folder}/typedi-example`,
      node_args: process.env.NODE_ARGS || "--max_old_space_size=1800",
      exec_mode: "cluster",
      instances: process.env.NODE_ENV === "test" ? 1 : process.env.NB_INSTANCES || 2,
      autorestart: true,
      max_memory_restart: process.env.MAX_MEMORY_RESTART || "750M",
      'out_file': defaultLogFile,
      'error_file': defaultLogFile,
      'merge_logs': true,
      'kill_timeout': 30000,
    }
  ]
}
