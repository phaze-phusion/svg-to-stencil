# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2022-07-13
- First OK-ish version

## [1.0.1] - 2019-07-18
### Added
- CHANGELOG.md

### Changed
- README.md instructions and notes
- Source converted to TypeScript
- Simplify the switch statement in `PathToLineClass.convert`

## [1.0.2] - 2019-07-21
### Added
- PathRegex.class.ts to hold all the many regex functions
- `PathToLineClass` methods to draw quadratic curves

### Changed
- Source directory structure to somewhat match Angular
- HTML element IDs are now stored in a separate enum
- Introduced stricter Types, made possible by TypeScript
- Renamed several methods to better describe their function
- Use binding instead of `handleEvent()` to pass "this" context reference

## [1.0.3] - 2019-07-22
### Added
- SVG preview
- RxJS package

### Changed
- Unwrapped `EngineClass` to form regular module called `user-interface.controller.ts`
- Move classes to components directory

## [1.0.4] - 2019-07-??
### Changed
- Split SVG Parser from user interface controller 
- Improve build mangle setting for eventual smaller dist files
