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

import { isEvent, isEventTime, Event, getEventTime } from './Event'

export const windowLocationEventType = 'WindowLocation'

export interface WindowLocationEvent extends Event {
    protocol: string
    hostname: string
    port: number
    path: string
    search: string
    hash: string
    windowReference: number
}

export function isWindowLocationEvent(data: any): data is WindowLocationEvent {
    const isValidEvent: boolean = isEvent(data) && data.type === windowLocationEventType
    if (!isValidEvent) {
        return false
    }

    const validProtocol: boolean = 'protocol' in data && typeof data.protocol === 'string'
    if (!validProtocol) {
        return false
    }

    const validHostname: boolean = 'hostname' in data && typeof data.hostname === 'string'
    if (!validHostname) {
        return false
    }

    const validPort: boolean = 'port' in data && typeof data.port === 'number' && data.port >= 0 && data.port <= 65535
    if (!validPort) {
        return false
    }

    const validPath: boolean = 'path' in data && typeof data.path === 'string'
    if (!validPath) {
        return false
    }

    const validSearch: boolean = 'search' in data && typeof data.search === 'string'
    if (!validSearch) {
        return false
    }

    const validHash: boolean = 'hash' in data && typeof data.hash === 'string'
    if (!validHash) {
        return false
    }

    const validWindowReference: boolean = 'windowReference' in data && typeof data.windowReference === 'number' && isEventTime(data.windowReference)
    if (!validWindowReference) {
        return false
    }

    return true
}

export function normalizeWindowLocationEvent(event: WindowLocationEvent): WindowLocationEvent {
    return {
        type: windowLocationEventType,
        time: event.time,
        protocol: event.protocol,
        hostname: event.hostname,
        port: event.port,
        path: event.path,
        search: event.search,
        hash: event.hash,
        windowReference: event.windowReference
    }
}


export function createWindowLocationEvent(windowReference: number): WindowLocationEvent {

    const protocol: string = window.location.protocol.replace(/:$/, '') // trim the tailing colon from this api call
    const hostname: string = window.location.hostname

    var port: number = 0
    var parsedPort: number = parseInt(window.location.port)
    if (!isNaN(parsedPort)) {
        // use the explicitly set port if there is one
        port = parsedPort
    }

    const path: string = window.location.pathname
    const search: string = window.location.search
    const hash: string = window.location.hash

    return {
        type: windowLocationEventType,
        time: getEventTime(),
        protocol: protocol,
        hostname: hostname,
        port: port,
        path: path,
        search: search,
        hash: hash,
        windowReference: windowReference
    }
}
