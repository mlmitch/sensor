// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2020 Mitchell Wasson

// This file is part of Weaklayer Sensor.

// Weaklayer Sensor is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { TextInputEvent } from '../../common/events/TextInputEvent'

export class TextInputSession {

    private readonly events: Array<TextInputEvent> = new Array<TextInputEvent>()

    trackTextInput(textInputEvent: TextInputEvent) {
        this.events.push(textInputEvent)
    }

    getInterestingTextInputs(): Array<TextInputEvent> {

        // this array should be mostly sorted already
        // we make sure they are in order so we can 
        // compare string lengths instead of doing substring operations
        this.events.sort((a, b) => {
            return a.time - b.time
        })

        const interestingInputs: Array<TextInputEvent> = new Array<TextInputEvent>()

        // Always take the first entry
        if (this.events.length >= 1) {
            interestingInputs.push(this.events[0])
        }

        if (this.events.length >= 3) {
            // Look for sliding window of 3 here.
            // We keep an input if it is a spike or a dip in string length
            for (let i = 1; i < this.events.length - 1; i++) {
                const lastEntry = this.events[i - 1]
                const thisEntry = this.events[i]
                const nextEntry = this.events[i + 1]

                if (lastEntry.text && thisEntry.text && nextEntry.text) {
                    const lastText: string = lastEntry.text
                    const thisText: string = thisEntry.text
                    const nextText: string = nextEntry.text

                    if (thisText.length >= lastText.length && nextText.length >= thisText.length) {
                        // monotonic increasing string
                    } else if (lastText.length >= thisText.length && thisText.length >= nextText.length) {
                        // monotonic decreasing string
                    } else {
                        interestingInputs.push(thisEntry)
                    }
                } else {
                    // Keep this entry. Don't want to discard because the one before or after was missing
                    console.warn("Received TextInput event from content script without text field")
                    interestingInputs.push(thisEntry)
                }

            }
        }

        // Always take the last entry because someone could backspace onto their password to finish
        if (this.events.length >= 2) {
            interestingInputs.push(this.events[this.events.length - 1])
        }

        return interestingInputs
    }
}