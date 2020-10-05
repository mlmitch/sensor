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

import { ManagedStorage } from './storage/ManagedStorage'
import { Installer } from './install/Installer'
import { Event } from '../common/events/Event'
import { gzip } from 'pako'

export class SensorEventAPI {

    private readonly installer: Installer

    constructor(installer: Installer) {
        this.installer = installer
    }

    async submit(events: Array<Event>): Promise<void> {

        // Shouldn't happen, but don't issue a request if 
        // called with length 0 array
        if (events.length <= 0) {
            return
        }

        // This will throw if things go bad with authentication (network error or failing response code)
        const headers = await this.getHeaders()

        const sensorApiBaseUrl: string = await ManagedStorage.getSensorApiEndpoint()
        const eventUrl = `${sensorApiBaseUrl}/events`

        // This will throw if things go bad
        const response = await fetch(eventUrl, {
            method: 'POST',
            body: gzip(JSON.stringify(events), { to: undefined }),
            headers: headers
        })

        // Non 2XX. Didn't work. Throw so we can retry
        if (response.status < 200 || 300 <= response.status) {
            if (400 <= response.status && response.status < 500) {
                // With 4XX there was an auth problem. Attempt reinstall on the next go.
                this.installer.forceReinstall()
            }

            throw new Error(`Received response code ${response.status} for event submission.`)
        }
    }

    private async getHeaders(): Promise<Headers> {
        const token = await this.installer.getAuthorizationToken()
        return new Headers({
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Authorization': `Bearer ${token}`
        })
    }
}
