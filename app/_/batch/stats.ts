#!/usr/bin/env node
import {stats, findDaily} from '../lib/MeiliSearch';
stats();

findDaily('2024-02-12').then((res) => console.log('call'));