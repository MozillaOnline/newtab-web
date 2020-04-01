/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { SimpleBelowSearchSnippet } from "./SimpleBelowSearchSnippet/SimpleBelowSearchSnippet";
import { SimpleSnippet } from "./SimpleSnippet/SimpleSnippet";

// Key names matching schema name of templates
export const SnippetsTemplates = {
  simple_snippet: SimpleSnippet,
  simple_below_search_snippet: SimpleBelowSearchSnippet,
};
