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

import { Installer } from './install/Installer'
import { SensorEventAPI } from './SensorEventAPI'
import { BackgroundHub } from './BackgroundHub'
import { HashKeyManager } from './text/HashKeyManager'
import { KeyedHasher } from './text/KeyedHasher'
import { TextInputEventFinalizer } from './text/TextInputEventFinalizer'
import { TextCaptureEvent, isTextCaptureEvent } from '../common/events/internal/TextCaptureEvent'
import { EventCollector } from './EventCollector'
import { WindowTracker } from './window/WindowTracker'
import { isWindowEvent } from '../common/events/WindowEvent'
import { LocalStorage } from './storage/LocalStorage'
import { TextCaptureSessionManager } from './text/TextCaptureSessionManager'
import { TextInputEventDeduplicator } from './text/TextInputEventDeduplicator'

console.info(`
Weaklayer Sensor is available under the terms of the GNU Affero General Public License (GNU AGPL).
Please see the program source for the exact GNU AGPL version.

The Weaklayer Sensor source is available at https://github.com/weaklayer/sensor

The Weaklayer Gateway source is available at https://github.com/weaklayer/gateway

For more information, please see https://weaklayer.com
`)

const installer = new Installer(() => LocalStorage.clearTextHashKey())
const sensorEventApi = new SensorEventAPI(installer)
const eventCollector = new EventCollector((es) => sensorEventApi.submit(es))

const textHashKeyManager = new HashKeyManager()
const textHasher: KeyedHasher = new KeyedHasher(() => textHashKeyManager.getHashKey())
const textInputEventFinalizer = new TextInputEventFinalizer(text => textHasher.computeStringHash(text))
const textInputEventDeduplicator = new TextInputEventDeduplicator(event => eventCollector.consumeEvents([event]))

const textInputSessionManager: TextCaptureSessionManager = new TextCaptureSessionManager(5000, 300000, async (events: Array<TextCaptureEvent>) => {
    const processedEvents = await textInputEventFinalizer.processTextCaptureEvents(events)
    processedEvents.forEach(async e => {
        textInputEventDeduplicator.processTextInput(e)
    })
})

const windowTracker = new WindowTracker()

const eventHub = new BackgroundHub((event, windowMetadata) => {
    if (isWindowEvent(event)) {
        windowTracker.mutateWindow(event, windowMetadata)
        eventCollector.consumeEvents([event])
    } else if (isTextCaptureEvent(event)) {
        textInputSessionManager.trackTextCapture(event)
    } else {
        eventCollector.consumeEvents([event])
    }
})

// Manually trigger an auth token get on startup
// This will force any required network calls
// So the token is present locally when it is needed.
installer.getAuthorizationToken().then(() => {
    console.info('Authorization token present.')
})
