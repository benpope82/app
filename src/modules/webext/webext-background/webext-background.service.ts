import angular from 'angular';
import { Injectable } from 'angular-ts-decorators';
import autobind from 'autobind-decorator';
import * as detectBrowser from 'detect-browser';
import { Alarms, browser, Notifications } from 'webextension-polyfill-ts';
import { Alert } from '../../shared/alert/alert.interface';
import AlertService from '../../shared/alert/alert.service';
import BookmarkHelperService from '../../shared/bookmark/bookmark-helper/bookmark-helper.service';
import * as Exceptions from '../../shared/exception/exception';
import { ExceptionHandler } from '../../shared/exception/exception.interface';
import Globals from '../../shared/global-shared.constants';
import { MessageCommand } from '../../shared/global-shared.enum';
import { Message, PlatformService } from '../../shared/global-shared.interface';
import LogService from '../../shared/log/log.service';
import NetworkService from '../../shared/network/network.service';
import SettingsService from '../../shared/settings/settings.service';
import { StoreKey } from '../../shared/store/store.enum';
import StoreService from '../../shared/store/store.service';
import SyncEngineService from '../../shared/sync/sync-engine/sync-engine.service';
import { SyncType } from '../../shared/sync/sync.enum';
import { Sync, SyncResult } from '../../shared/sync/sync.interface';
import UpgradeService from '../../shared/upgrade/upgrade.service';
import UtilityService from '../../shared/utility/utility.service';
import ChromiumBookmarkService from '../chromium/shared/chromium-bookmark/chromium-bookmark.service';
import BookmarkIdMapperService from '../shared/bookmark-id-mapper/bookmark-id-mapper.service';
import { InstallBackup } from '../webext.interface';

@autobind
@Injectable('WebExtBackgroundService')
export default class WebExtBackgroundService {
  Strings = require('../../../../res/strings/en.json');

  $exceptionHandler: ExceptionHandler;
  $q: ng.IQService;
  $timeout: ng.ITimeoutService;
  alertSvc: AlertService;
  bookmarkIdMapperSvc: BookmarkIdMapperService;
  bookmarkHelperSvc: BookmarkHelperService;
  bookmarkSvc: ChromiumBookmarkService;
  logSvc: LogService;
  networkSvc: NetworkService;
  platformSvc: PlatformService;
  settingsSvc: SettingsService;
  storeSvc: StoreService;
  syncEngineSvc: SyncEngineService;
  upgradeSvc: UpgradeService;
  utilitySvc: UtilityService;

  notificationClickHandlers: any[] = [];

  static $inject = [
    '$exceptionHandler',
    '$q',
    '$timeout',
    'AlertService',
    'BookmarkHelperService',
    'BookmarkIdMapperService',
    'BookmarkService',
    'LogService',
    'NetworkService',
    'PlatformService',
    'SettingsService',
    'StoreService',
    'SyncEngineService',
    'UpgradeService',
    'UtilityService'
  ];
  constructor(
    $exceptionHandler: ExceptionHandler,
    $q: ng.IQService,
    $timeout: ng.ITimeoutService,
    AlertSvc: AlertService,
    BookmarkHelperSvc: BookmarkHelperService,
    BookmarkIdMapperSvc: BookmarkIdMapperService,
    BookmarkSvc: ChromiumBookmarkService,
    LogSvc: LogService,
    NetworkSvc: NetworkService,
    PlatformSvc: PlatformService,
    SettingsSvc: SettingsService,
    StoreSvc: StoreService,
    SyncEngineSvc: SyncEngineService,
    UpgradeSvc: UpgradeService,
    UtilitySvc: UtilityService
  ) {
    this.$exceptionHandler = $exceptionHandler;
    this.$q = $q;
    this.$timeout = $timeout;
    this.alertSvc = AlertSvc;
    this.bookmarkIdMapperSvc = BookmarkIdMapperSvc;
    this.bookmarkHelperSvc = BookmarkHelperSvc;
    this.bookmarkSvc = BookmarkSvc;
    this.logSvc = LogSvc;
    this.networkSvc = NetworkSvc;
    this.platformSvc = PlatformSvc;
    this.settingsSvc = SettingsSvc;
    this.storeSvc = StoreSvc;
    this.syncEngineSvc = SyncEngineSvc;
    this.upgradeSvc = UpgradeSvc;
    this.utilitySvc = UtilitySvc;

    browser.alarms.onAlarm.addListener(this.onAlarm);
    browser.notifications.onClicked.addListener(this.onNotificationClicked);
    browser.notifications.onClosed.addListener(this.onNotificationClosed);
    browser.runtime.onMessage.addListener(this.onMessage);
  }

  checkForNewVersion(): void {
    this.platformSvc.getAppVersion().then((appVersion) => {
      return this.utilitySvc.checkForNewVersion(appVersion).then((newVersion) => {
        if (!newVersion) {
          return;
        }

        const alert: Alert = {
          message: this.platformSvc
            .getI18nString(this.Strings.Alert.AppUpdateAvailable.Message)
            .replace('{version}', newVersion),
          title: this.platformSvc.getI18nString(this.Strings.Alert.AppUpdateAvailable.Title)
        };
        this.displayAlert(alert, Globals.ReleaseNotesUrlStem + newVersion.replace(/^v/, ''));
      });
    });
  }

  checkForSyncUpdates(): ng.IPromise<SyncResult | void> {
    // Exit if currently syncing
    const currentSync = this.syncEngineSvc.getCurrentSync();
    if (currentSync) {
      return this.$q.resolve();
    }

    // Exit if sync not enabled
    return this.utilitySvc
      .isSyncEnabled()
      .then((syncEnabled) => {
        if (!syncEnabled) {
          return;
        }

        return this.syncEngineSvc.checkForUpdates().then((updatesAvailable) => {
          if (!updatesAvailable) {
            return;
          }

          // Queue sync
          return this.platformSvc.queueSync({
            type: SyncType.Local
          });
        });
      })
      .catch(this.checkForSyncUpdatesFailed);
  }

  checkForSyncUpdatesFailed(err: Error): void {
    // Don't display alert if sync failed due to network connection
    if (this.networkSvc.isNetworkConnectionError(err)) {
      this.logSvc.logInfo('Could not check for updates, no connection');
      return;
    }

    // If ID was removed disable sync
    if (err instanceof Exceptions.NoDataFoundException) {
      this.syncEngineSvc.disableSync();
      throw new Exceptions.SyncRemovedException(undefined, err);
    }

    throw err;
  }

  checkForSyncUpdatesOnStartup(): ng.IPromise<SyncResult | void> {
    return this.$q<boolean>((resolve, reject) => {
      return this.utilitySvc.isSyncEnabled().then((syncEnabled) => {
        if (!syncEnabled) {
          return resolve();
        }

        // Check for updates to synced bookmarks
        this.syncEngineSvc
          .checkForUpdates()
          .then(resolve)
          .catch((err) => {
            if (!(err instanceof Exceptions.HttpRequestFailedException)) {
              return reject(err);
            }

            // If request failed, retry once
            this.logSvc.logInfo('Connection to API failed, retrying check for sync updates momentarily');
            this.$timeout(() => {
              this.utilitySvc.isSyncEnabled().then((syncEnabledAfterError) => {
                if (!syncEnabledAfterError) {
                  this.logSvc.logInfo('Sync was disabled before retry attempted');
                  return reject(new Exceptions.HttpRequestCancelledException());
                }
                this.syncEngineSvc.checkForUpdates().then(resolve).catch(reject);
              });
            }, 5000);
          });
      });
    })
      .then((updatesAvailable) => {
        if (!updatesAvailable) {
          return;
        }

        // Queue sync
        return this.platformSvc.queueSync({
          type: SyncType.Local
        });
      })
      .catch(this.checkForSyncUpdatesFailed);
  }

  displayAlert(alert: Alert, url?: string): void {
    // Strip html tags from message
    const urlRegex = new RegExp(Globals.URL.ValidUrlRegex);
    const matches = alert.message.match(urlRegex);
    const messageToDisplay =
      matches?.length === 0
        ? alert.message
        : new DOMParser().parseFromString(`<span>${alert.message}</span>`, 'text/xml').firstElementChild.textContent;

    const options: Notifications.CreateNotificationOptions = {
      iconUrl: `${Globals.PathToAssets}/notification.svg`,
      message: messageToDisplay,
      title: alert.title,
      type: 'basic'
    };

    // Display notification
    browser.notifications.create(this.utilitySvc.getUniqueishId(), options).then((notificationId) => {
      // Add a click handler to open url if provided or if the message contains a url
      let urlToOpenOnClick = url;
      if (matches?.length) {
        urlToOpenOnClick = matches[0];
      }

      if (urlToOpenOnClick) {
        const openUrlInNewTab = () => {
          this.platformSvc.openUrl(urlToOpenOnClick);
        };
        this.notificationClickHandlers.push({
          id: notificationId,
          eventHandler: openUrlInNewTab
        });
      }
    });
  }

  getCurrentVersion(): string {
    return browser.runtime.getManifest().version;
  }

  init(): void {
    this.logSvc.logInfo('Starting up');

    // Before initialising, check if upgrade required
    this.upgradeSvc
      .checkIfUpgradeRequired(this.getCurrentVersion())
      .then((upgradeRequired) => upgradeRequired && this.upgradeExtension())
      .then(() =>
        this.$q
          .all([
            this.platformSvc.getAppVersion(),
            this.settingsSvc.all(),
            this.storeSvc.get([StoreKey.LastUpdated, StoreKey.SyncId, StoreKey.SyncVersion]),
            this.utilitySvc.getServiceUrl(),
            this.utilitySvc.isSyncEnabled()
          ])
          .then((data) => {
            const appVersion = data[0];
            const settings = data[1];
            const storeContent = data[2];
            const serviceUrl = data[3];
            const syncEnabled = data[4];

            // Add useful debug info to beginning of trace log
            const debugInfo = angular.copy(storeContent) as any;
            debugInfo.appVersion = appVersion;
            debugInfo.checkForAppUpdates = settings.checkForAppUpdates;
            debugInfo.platform = detectBrowser.detect();
            debugInfo.platform.name = this.utilitySvc.getBrowserName();
            debugInfo.serviceUrl = serviceUrl;
            debugInfo.syncBookmarksToolbar = settings.syncBookmarksToolbar;
            debugInfo.syncEnabled = syncEnabled;
            this.logSvc.logInfo(
              Object.keys(debugInfo)
                .filter((key) => {
                  return debugInfo[key] != null;
                })
                .reduce((prev, current) => {
                  prev[current] = debugInfo[current];
                  return prev;
                }, {})
            );

            // Update browser action icon
            this.platformSvc.refreshNativeInterface(syncEnabled);

            // Check for new app version after a delay
            if (settings.checkForAppUpdates) {
              this.$timeout(this.checkForNewVersion, 5e3);
            }

            // Enable sync and check for updates after a delay to allow for initialising network connection
            if (!syncEnabled) {
              return;
            }
            return this.syncEngineSvc.enableSync().then(() => this.$timeout(this.checkForSyncUpdatesOnStartup, 5e3));
          })
      );
  }

  installExtension(): ng.IPromise<void> {
    // Initialise data storage
    return (
      this.storeSvc
        .init()
        .then(() =>
          this.$q.all([
            this.storeSvc.set(StoreKey.DisplayOtherSyncsWarning, true),
            this.storeSvc.set(StoreKey.DisplayPermissions, true),
            this.storeSvc.set(StoreKey.SyncBookmarksToolbar, true)
          ])
        )
        .then(() => {
          // Get native bookmarks and save data state at install to store
          return this.bookmarkSvc.getNativeBookmarksAsBookmarks().then((bookmarks) => {
            const backup: InstallBackup = {
              bookmarks,
              date: new Date().toISOString()
            };
            return this.storeSvc.set(StoreKey.InstallBackup, JSON.stringify(backup));
          });
        })
        // Set the initial upgrade version
        .then(() => this.upgradeSvc.setLastUpgradeVersion(this.getCurrentVersion()))
        .then(() => {
          this.logSvc.logInfo(`Installed v${this.getCurrentVersion()}`);
        })
        .catch(this.$exceptionHandler)
    );
  }

  onAlarm(alarm: Alarms.Alarm): void {
    // When alarm fires check for sync updates
    if (alarm?.name === Globals.Alarm.Name) {
      this.checkForSyncUpdates();
    }
  }

  onInstall(event: InputEvent): void {
    // Check if fresh install needed
    const details = angular.element(event.currentTarget as Element).data('details');
    (details?.reason === 'install' ? this.installExtension() : this.$q.resolve()).then(this.init);
  }

  onNotificationClicked(notificationId: string): void {
    // Execute the event handler if one exists and then remove
    const notificationClickHandler = this.notificationClickHandlers.find((x) => {
      return x.id === notificationId;
    });
    if (notificationClickHandler != null) {
      notificationClickHandler.eventHandler();
      browser.notifications.clear(notificationId);
    }
  }

  onNotificationClosed(notificationId: string): void {
    // Remove the handler for this notification if one exists
    const index = this.notificationClickHandlers.findIndex((x) => {
      return x.id === notificationId;
    });
    if (index >= 0) {
      this.notificationClickHandlers.splice(index, 1);
    }
  }

  onMessage(message: Message): Promise<any> {
    // Use native Promise not $q otherwise browser.runtime.sendMessage will return immediately in Firefox
    return new Promise((resolve, reject) => {
      let action: ng.IPromise<any>;
      switch (message.command) {
        // Queue bookmarks sync
        case MessageCommand.SyncBookmarks:
          action = this.runSyncBookmarksCommand(message.sync, message.runSync);
          break;
        // Trigger bookmarks restore
        case MessageCommand.RestoreBookmarks:
          action = this.runRestoreBookmarksCommand(message.sync);
          break;
        // Get current sync in progress
        case MessageCommand.GetCurrentSync:
          action = this.runGetCurrentSyncCommand();
          break;
        // Get current number of syncs on the queue
        case MessageCommand.GetSyncQueueLength:
          action = this.runGetSyncQueueLengthCommand();
          break;
        // Disable sync
        case MessageCommand.DisableSync:
          action = this.runDisableSyncCommand();
          break;
        // Enable event listeners
        case MessageCommand.EnableEventListeners:
          action = this.runEnableEventListenersCommand();
          break;
        // Disable event listeners
        case MessageCommand.DisableEventListeners:
          action = this.runDisableEventListenersCommand();
          break;
        // Unknown command
        default:
          action = this.$q.reject(new Exceptions.AmbiguousSyncRequestException());
      }
      return action.then(resolve).catch(reject);
    }).catch((err) => {
      // Set message to exception class name so sender can rehydrate the exception on receipt
      err.message = err.constructor.name;
      throw err;
    });
  }

  runDisableEventListenersCommand(): ng.IPromise<void> {
    return this.bookmarkSvc.disableEventListeners();
  }

  runDisableSyncCommand(): ng.IPromise<void> {
    return this.syncEngineSvc.disableSync();
  }

  runEnableEventListenersCommand(): ng.IPromise<void> {
    return this.bookmarkSvc.enableEventListeners();
  }

  runGetCurrentSyncCommand(): ng.IPromise<Sync> {
    return this.$q.resolve(this.syncEngineSvc.getCurrentSync());
  }

  runGetSyncQueueLengthCommand(): ng.IPromise<number> {
    return this.$q.resolve(this.syncEngineSvc.getSyncQueueLength());
  }

  runRestoreBookmarksCommand(sync: Sync): ng.IPromise<SyncResult> {
    return this.bookmarkSvc.disableEventListeners().then(() => {
      // Queue sync
      return this.syncEngineSvc.queueSync(sync).then(
        () =>
          ({
            success: true
          } as SyncResult)
      );
    });
  }

  runSyncBookmarksCommand(sync: Sync, runSync: boolean): ng.IPromise<SyncResult> {
    return this.syncEngineSvc.queueSync(sync, runSync).then(
      () =>
        ({
          success: true
        } as SyncResult)
    );
  }

  upgradeExtension(): ng.IPromise<void> {
    return this.upgradeSvc.upgrade(this.getCurrentVersion()).then(() => {
      return this.platformSvc.getAppVersion().then((appVersion) => {
        // Display alert and set update panel to show
        const alert: Alert = {
          message: this.platformSvc.getI18nString(this.Strings.Alert.AppUpdated.Message),
          title: `${this.platformSvc.getI18nString(this.Strings.Alert.AppUpdated.Title)} ${appVersion}`
        };
        this.displayAlert(alert, Globals.ReleaseNotesUrlStem + appVersion);
        return this.storeSvc.set(StoreKey.DisplayUpdated, true);
      });
    });
  }
}
