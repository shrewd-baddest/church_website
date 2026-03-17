/**
 * DOM Helper Utilities
 * Specialized functions for lean DOM manipulation without a heavy framework
 */
export class DOMHelpers {
    /**
     * Create an element with classes and attributes
     */
    static createElement(tag: any, className: any = '', attributes: any = {}) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        
        return element;
    }

    /**
     * Clear all children from an element
     */
    static clearElement(element: any) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Append multiple children to a parent
     */
    static appendChildren(parent: any, children: any) {
        children.forEach((child: any) => {
            if (child) {
                parent.appendChild(child);
            }
        });
    }

    /**
     * Add multiple event listeners to an element
     */
    static addEventListeners(element: any, events: any) {
        Object.keys(events).forEach(event => {
            element.addEventListener(event, events[event]);
        });
    }
}
